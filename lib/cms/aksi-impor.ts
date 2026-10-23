"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { bacaCsv } from "@/lib/csv";
import { enkripsi, hashIdentitas } from "@/lib/enkripsi";
import { wargaMasuk } from "@/lib/cms/skema-warga";
import type { Hubungan, Hunian } from "@/lib/warga-label";

/**
 * Impor data warga dari CSV.
 *
 * Dua langkah dengan isi file yang sama: `pratinjauImpor` hanya memeriksa,
 * `jalankanImpor` memeriksa ULANG lalu menulis. Server tidak pernah memercayai
 * hasil pratinjau yang dikirim klien. Bila ada satu saja baris bermasalah,
 * tidak ada yang ditulis: semua atau tidak sama sekali.
 *
 * Kolom: nomor_rumah (wajib), nama (wajib), blok, kode_keluarga, nik,
 * jenis_kelamin, hubungan, tanggal_lahir, tempat_lahir, no_hp, pekerjaan,
 * status_hunian. Baris dengan blok, nomor_rumah, dan kode_keluarga yang sama
 * menjadi satu keluarga baru.
 */

const MAKS_BYTE = 1_000_000;
const MAKS_BARIS = 1000;
const UUID_SEMENTARA = "00000000-0000-4000-8000-000000000000";

export type GalatBaris = { baris: number; pesan: string };
export type HasilPratinjau =
  | {
      ok: true;
      ringkasan: { baris: number; rumahBaru: number; keluargaBaru: number; wargaBaru: number };
      galat: GalatBaris[];
    }
  | { ok: false; pesan: string };

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s-]+/g, "_");

function petaJk(s: string): string {
  const n = norm(s);
  if (["l", "laki_laki", "pria", "lk"].includes(n)) return "LAKI_LAKI";
  if (["p", "perempuan", "wanita", "pr"].includes(n)) return "PEREMPUAN";
  return s.trim() === "" ? "" : "?";
}

function petaHubungan(s: string): Hubungan | "?" {
  const n = norm(s);
  if (n === "") return "LAINNYA";
  if (["kepala_keluarga", "kepala", "kk"].includes(n)) return "KEPALA_KELUARGA";
  if (["pasangan", "istri", "isteri", "suami"].includes(n)) return "PASANGAN";
  if (n === "anak") return "ANAK";
  if (["orang_tua", "ortu"].includes(n)) return "ORANG_TUA";
  if (["famili_lain", "famili", "saudara"].includes(n)) return "FAMILI_LAIN";
  if (n === "lainnya") return "LAINNYA";
  return "?";
}

function petaHunian(s: string): Hunian | "?" {
  const n = norm(s);
  if (n === "" || ["pemilik", "milik"].includes(n)) return "PEMILIK";
  if (["penyewa", "kontrak", "sewa", "kontraktor"].includes(n)) return "PENYEWA";
  if (n === "lainnya") return "LAINNYA";
  return "?";
}

/** Menerima 2000-01-31 atau 31/01/2000; mengembalikan format ISO atau teks asal. */
function petaTanggal(s: string): string {
  const t = s.trim();
  const m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}` : t;
}

type Baris = {
  nomorBaris: number;
  blok: string;
  nomor: string;
  kode: string;
  hunian: Hunian;
  data: ReturnType<typeof wargaMasuk.parse>;
};

async function periksa(
  csv: string,
): Promise<{ baris: Baris[]; galat: GalatBaris[] } | { fatal: string }> {
  if (Buffer.byteLength(csv, "utf8") > MAKS_BYTE) {
    return { fatal: "Berkas terlalu besar. Maksimal 1 MB." };
  }
  const tabel = bacaCsv(csv);
  if (tabel.length < 2) return { fatal: "Berkas kosong atau hanya berisi judul kolom." };
  if (tabel.length - 1 > MAKS_BARIS) {
    return { fatal: `Terlalu banyak baris. Maksimal ${MAKS_BARIS} baris per impor.` };
  }

  const kolom = tabel[0]!.map(norm);
  const idx = (n: string) => kolom.indexOf(n);
  for (const wajib of ["nomor_rumah", "nama"]) {
    if (idx(wajib) < 0) return { fatal: `Kolom "${wajib}" tidak ditemukan pada baris judul.` };
  }
  const ambil = (b: string[], n: string) => (idx(n) < 0 ? "" : (b[idx(n)] ?? "").trim());

  const galat: GalatBaris[] = [];
  const baris: Baris[] = [];

  tabel.slice(1).forEach((b, i) => {
    const nomorBaris = i + 2;
    const salah = (pesan: string) => galat.push({ baris: nomorBaris, pesan });

    const blok = (ambil(b, "blok") || "G").toUpperCase();
    const nomor = ambil(b, "nomor_rumah").toUpperCase();
    if (!nomor) return salah("nomor_rumah kosong.");
    if (blok.length > 10 || nomor.length > 10) return salah("blok atau nomor_rumah terlalu panjang.");

    const hubungan = petaHubungan(ambil(b, "hubungan"));
    if (hubungan === "?") return salah(`hubungan "${ambil(b, "hubungan")}" tidak dikenal.`);
    const hunian = petaHunian(ambil(b, "status_hunian"));
    if (hunian === "?") return salah(`status_hunian "${ambil(b, "status_hunian")}" tidak dikenal.`);
    const jk = petaJk(ambil(b, "jenis_kelamin"));
    if (jk === "?") return salah(`jenis_kelamin "${ambil(b, "jenis_kelamin")}" tidak dikenal (pakai L atau P).`);

    const h = wargaMasuk.safeParse({
      keluargaId: UUID_SEMENTARA,
      namaLengkap: ambil(b, "nama"),
      nik: ambil(b, "nik"),
      jenisKelamin: jk,
      tempatLahir: ambil(b, "tempat_lahir"),
      tanggalLahir: petaTanggal(ambil(b, "tanggal_lahir")),
      hubungan,
      statusDomisili: "AKTIF",
      noHp: ambil(b, "no_hp"),
      pekerjaan: ambil(b, "pekerjaan"),
    });
    if (!h.success) return salah(h.error.issues[0]?.message ?? "Isian tidak valid.");

    baris.push({
      nomorBaris,
      blok,
      nomor,
      kode: ambil(b, "kode_keluarga"),
      hunian,
      data: h.data,
    });
  });

  // NIK ganda di dalam berkas.
  const lihatNik = new Map<string, number>();
  for (const r of baris) {
    if (!r.data.nik) continue;
    const sebelumnya = lihatNik.get(r.data.nik);
    if (sebelumnya) galat.push({ baris: r.nomorBaris, pesan: `NIK sama dengan baris ${sebelumnya}.` });
    else lihatNik.set(r.data.nik, r.nomorBaris);
  }

  // Satu kepala keluarga per kelompok.
  const kepala = new Map<string, number>();
  for (const r of baris) {
    if (r.data.hubungan !== "KEPALA_KELUARGA") continue;
    const kunci = `${r.blok}|${r.nomor}|${r.kode}`;
    const sebelumnya = kepala.get(kunci);
    if (sebelumnya) galat.push({ baris: r.nomorBaris, pesan: `Kelompok keluarga ini sudah punya kepala keluarga di baris ${sebelumnya}.` });
    else kepala.set(kunci, r.nomorBaris);
  }

  // Terhadap database: NIK yang sudah terdaftar.
  const hashPerBaris = new Map<string, Baris>();
  for (const r of baris) if (r.data.nik) hashPerBaris.set(hashIdentitas(r.data.nik), r);
  if (hashPerBaris.size > 0) {
    const ada = await db().warga.findMany({
      where: { nikHash: { in: [...hashPerBaris.keys()] } },
      select: { nikHash: true },
    });
    for (const a of ada) {
      const r = a.nikHash ? hashPerBaris.get(a.nikHash) : undefined;
      if (r) galat.push({ baris: r.nomorBaris, pesan: "NIK sudah terdaftar di sistem." });
    }
  }

  galat.sort((a, b) => a.baris - b.baris);
  return { baris, galat };
}

const kunciKeluarga = (r: Baris) => `${r.blok}|${r.nomor}|${r.kode}`;

export async function pratinjauImpor(csv: string): Promise<HasilPratinjau> {
  const cek = await periksaIzinAksi("residents.create");
  if (!cek.ok) return cek;

  const h = await periksa(csv);
  if ("fatal" in h) return { ok: false, pesan: h.fatal };

  const rumahDikenal = new Set(
    (
      await db().rumah.findMany({
        where: { OR: [...new Set(h.baris.map((r) => `${r.blok}|${r.nomor}`))].map((k) => {
          const [blok, nomor] = k.split("|");
          return { blok, nomor };
        }) },
        select: { blok: true, nomor: true },
      })
    ).map((r) => `${r.blok}|${r.nomor}`),
  );
  const rumah = new Set(h.baris.map((r) => `${r.blok}|${r.nomor}`));

  return {
    ok: true,
    ringkasan: {
      baris: h.baris.length,
      rumahBaru: [...rumah].filter((k) => !rumahDikenal.has(k)).length,
      keluargaBaru: new Set(h.baris.map(kunciKeluarga)).size,
      wargaBaru: h.baris.length,
    },
    galat: h.galat,
  };
}

export type HasilImpor =
  | { ok: true; rumah: number; keluarga: number; warga: number }
  | { ok: false; pesan: string };

export async function jalankanImpor(csv: string): Promise<HasilImpor> {
  const cek = await periksaIzinAksi("residents.create");
  if (!cek.ok) return cek;

  const h = await periksa(csv);
  if ("fatal" in h) return { ok: false, pesan: h.fatal };
  if (h.galat.length > 0) {
    return { ok: false, pesan: `Masih ada ${h.galat.length} baris bermasalah. Perbaiki berkasnya lalu coba lagi.` };
  }
  if (h.baris.length === 0) return { ok: false, pesan: "Tidak ada baris untuk diimpor." };

  try {
    const hasil = await db().$transaction(
      async (tx) => {
        const idRumah = new Map<string, string>();
        const idKeluarga = new Map<string, string>();
        let rumahBaru = 0;

        for (const r of h.baris) {
          const kr = `${r.blok}|${r.nomor}`;
          if (!idRumah.has(kr)) {
            const ada = await tx.rumah.findUnique({
              where: { blok_nomor: { blok: r.blok, nomor: r.nomor } },
              select: { id: true },
            });
            if (ada) idRumah.set(kr, ada.id);
            else {
              const baru = await tx.rumah.create({ data: { blok: r.blok, nomor: r.nomor } });
              idRumah.set(kr, baru.id);
              rumahBaru++;
            }
          }
          const kk = kunciKeluarga(r);
          if (!idKeluarga.has(kk)) {
            const k = await tx.keluarga.create({
              data: { rumahId: idRumah.get(kr)!, statusHunian: r.hunian },
            });
            idKeluarga.set(kk, k.id);
          }
          const { nik, ...data } = r.data;
          await tx.warga.create({
            data: {
              ...data,
              keluargaId: idKeluarga.get(kk)!,
              ...(nik
                ? { nikEnkripsi: enkripsi(nik), nikHash: hashIdentitas(nik), nikAkhir4: nik.slice(-4) }
                : {}),
            },
          });
        }
        return { rumah: rumahBaru, keluarga: idKeluarga.size, warga: h.baris.length };
      },
      { timeout: 60_000 },
    );

    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "warga.impor",
      entitas: "warga",
      metadata: hasil,
    });
    revalidatePath("/admin/warga", "layout");
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, ...hasil };
  } catch (e) {
    console.error("[impor] gagal:", e);
    return { ok: false, pesan: "Impor gagal dan tidak ada data yang ditulis. Coba lagi." };
  }
}
