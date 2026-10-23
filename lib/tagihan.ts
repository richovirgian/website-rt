import { db } from "@/lib/db";
import {
  FORMAT_PERIODE,
  jatuhTempoBulanan,
  labelPeriode,
  periodeSekarang,
  tanggalUtc,
  hariIni,
} from "@/lib/uang";
import type { Frekuensi } from "@/lib/iuran-label";
import { beriNotifikasi, userIdPerRumah } from "@/lib/notifikasi";
import { formatRupiah } from "@/lib/uang";

/**
 * Penerbitan tagihan. Dipakai bersama oleh aksi manual (admin dan bendahara)
 * dan penjadwal otomatis, sehingga aturannya satu: tidak ada jalur yang bisa
 * menerbitkan tagihan dengan cara berbeda.
 *
 * IDEMPOTEN. Unik pada (rumah, jenis, periode) di database, dan penulisan
 * memakai `skipDuplicates` (INSERT ... ON CONFLICT DO NOTHING). Dijalankan
 * dua kali, atau oleh dua orang bersamaan, hasilnya tetap satu tagihan per
 * rumah per periode. Yang sudah ada dilewati, bukan ditimpa.
 */

/** Tanggal acuan untuk nominal: awal periode, supaya hasilnya tetap pada tiap pengulangan. */
function tanggalAcuan(frekuensi: Frekuensi, periode: string): string {
  if (frekuensi === "BULANAN") return `${periode}-01`;
  if (frekuensi === "TAHUNAN") return `${periode}-01-01`;
  return hariIni();
}

/** Nominal yang berlaku pada tanggal itu, atau null bila belum ada aturan. */
export async function nominalBerlaku(
  jenisIuranId: string,
  tanggalIso: string,
): Promise<number | null> {
  const a = await db().aturanIuran.findFirst({
    where: { jenisIuranId, berlakuMulai: { lte: tanggalUtc(tanggalIso) } },
    orderBy: { berlakuMulai: "desc" },
    select: { nominal: true },
  });
  return a ? a.nominal.toNumber() : null;
}

/** Rumah yang memiliki setidaknya satu keluarga yang masih tinggal. */
export async function rumahBerpenghuni(): Promise<{ id: string; blok: string; nomor: string }[]> {
  return db().rumah.findMany({
    where: { keluarga: { some: { tanggalKeluar: null } } },
    orderBy: [{ blok: "asc" }, { nomor: "asc" }],
    select: { id: true, blok: true, nomor: true },
  });
}

export type HasilTerbit =
  | { ok: true; ditargetkan: number; dibuat: number; dilewati: number; nominal: number }
  | { ok: false; pesan: string; galat?: Record<string, string> };

export async function terbitkanTagihan(p: {
  jenisIuranId: string;
  periode: string;
  jatuhTempo: string;
  /** null berarti seluruh rumah berpenghuni. */
  rumahIds: string[] | null;
  /** null berarti nominal yang berlaku. */
  nominalKhusus: number | null;
  aktor: string;
}): Promise<HasilTerbit> {
  const jenis = await db().jenisIuran.findUnique({ where: { id: p.jenisIuranId } });
  if (!jenis) return { ok: false, pesan: "Jenis iuran tidak ditemukan." };
  if (!jenis.aktif) return { ok: false, pesan: "Jenis iuran ini tidak aktif.", galat: { jenisIuranId: "Jenis iuran tidak aktif." } };

  if (!FORMAT_PERIODE[jenis.frekuensi].test(p.periode)) {
    const contoh = { BULANAN: "2026-11", TAHUNAN: "2026", SEKALI: "SEKALI" }[jenis.frekuensi];
    return { ok: false, pesan: `Periode tidak sesuai frekuensi iuran. Contoh: ${contoh}.`, galat: { periode: `Gunakan format seperti ${contoh}.` } };
  }

  const nominal =
    p.nominalKhusus ??
    (await nominalBerlaku(jenis.id, tanggalAcuan(jenis.frekuensi, p.periode)));
  if (nominal === null) {
    return { ok: false, pesan: "Iuran ini belum punya nominal untuk periode tersebut. Atur nominalnya di halaman Iuran.", galat: { jenisIuranId: "Belum ada nominal yang berlaku." } };
  }

  const rumah = p.rumahIds
    ? await db().rumah.findMany({ where: { id: { in: p.rumahIds } }, select: { id: true } })
    : await rumahBerpenghuni();
  if (rumah.length === 0) {
    return { ok: false, pesan: p.rumahIds ? "Rumah yang dipilih tidak ditemukan." : "Belum ada rumah berpenghuni untuk ditagih." };
  }

  const judul =
    jenis.frekuensi === "SEKALI" ? jenis.nama : `${jenis.nama} — ${labelPeriode(p.periode)}`;

  const mulaiTulis = new Date();
  const hasil = await db().tagihan.createMany({
    data: rumah.map((r) => ({
      rumahId: r.id,
      jenisIuranId: jenis.id,
      periode: p.periode,
      judul,
      nominal,
      jatuhTempo: tanggalUtc(p.jatuhTempo),
      diterbitkanOleh: p.aktor,
    })),
    skipDuplicates: true,
  });

  // Notifikasi hanya untuk tagihan yang BARU dibuat dalam penerbitan ini (yang
  // dilewati tidak diberi notifikasi lagi). Kegagalannya tidak membatalkan penerbitan.
  if (hasil.count > 0) {
    try {
      const baru = await db().tagihan.findMany({
        where: { jenisIuranId: jenis.id, periode: p.periode, rumahId: { in: rumah.map((r) => r.id) }, dibuatPada: { gte: mulaiTulis } },
        select: { id: true, rumahId: true },
      });
      const peta = await userIdPerRumah(baru.map((t) => t.rumahId));
      for (const t of baru) {
        await beriNotifikasi(db(), {
          userIds: peta.get(t.rumahId) ?? [],
          jenis: "tagihan-baru",
          judul: "Tagihan baru",
          isi: `${judul}: ${formatRupiah(nominal)}, jatuh tempo ${p.jatuhTempo}.`,
          tautan: "/admin/tagihan-saya",
          kunci: `tagihan-baru:${t.id}`,
        });
      }
    } catch (e) {
      console.error("[notifikasi] gagal memberi tahu tagihan baru:", e);
    }
  }

  return {
    ok: true,
    ditargetkan: rumah.length,
    dibuat: hasil.count,
    dilewati: rumah.length - hasil.count,
    nominal,
  };
}

export type HasilOtomatis = {
  jenis: string;
  status: "ok" | "gagal" | "lewat";
  dibuat?: number;
  dilewati?: number;
  pesan?: string;
}[];

/**
 * Dipanggil penjadwal: untuk setiap iuran bulanan yang aktif dan diizinkan
 * terbit otomatis, terbitkan tagihan periode berjalan. Aman dijalankan
 * berulang kali.
 *
 * Hanya menerbitkan selama jatuh tempo bulan itu BELUM lewat. Tanpa aturan
 * ini, menyalakan "terbit otomatis" pada tanggal 23 langsung membuat tagihan
 * berjatuh tempo tanggal 10: warga menerima tagihan yang sudah Terlambat
 * tanpa pernah sempat membayar. Iuran yang terlewat bulan itu bisa
 * diterbitkan manual, atau menunggu bulan berikutnya.
 */
export async function terbitkanOtomatis(sekarang: Date = new Date()): Promise<HasilOtomatis> {
  const periode = periodeSekarang(sekarang);
  const daftar = await db().jenisIuran.findMany({
    where: { aktif: true, terbitOtomatis: true, frekuensi: "BULANAN" },
  });

  const hasil: HasilOtomatis = [];
  for (const j of daftar) {
    const jatuhTempo = jatuhTempoBulanan(periode, j.hariJatuhTempo);
    if (hariIni(sekarang) > jatuhTempo) {
      hasil.push({
        jenis: j.nama,
        status: "lewat",
        pesan: "Jatuh tempo bulan ini sudah lewat; menunggu bulan berikutnya atau terbitkan manual.",
      });
      continue;
    }
    const r = await terbitkanTagihan({
      jenisIuranId: j.id,
      periode,
      jatuhTempo,
      rumahIds: null,
      nominalKhusus: null,
      aktor: "Sistem",
    });
    hasil.push(
      r.ok
        ? { jenis: j.nama, status: "ok", dibuat: r.dibuat, dilewati: r.dilewati }
        : { jenis: j.nama, status: "gagal", pesan: r.pesan },
    );
  }
  return hasil;
}
