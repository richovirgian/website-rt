"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { alasanMasuk, transferMasuk, tunaiMasuk } from "@/lib/cms/skema-pembayaran";
import { periksaBerkas } from "@/lib/bukti";
import { kategoriWajib, KATEGORI_IURAN, KATEGORI_KOREKSI } from "@/lib/kas";
import { nomorBerikut } from "@/lib/nomor";
import { rumahIdMilik } from "@/lib/pembayaran-kueri";
import { beriNotifikasiAman, userIdAdmin, userIdPerRumah } from "@/lib/notifikasi";
import { hariIni, tanggalUtc } from "@/lib/uang";
import { kodeRumah } from "@/lib/warga-label";

/**
 * Aksi pembayaran. Setiap alur yang mengubah uang berjalan dalam SATU
 * transaksi database dengan baris yang dikunci (`FOR UPDATE`): dua orang yang
 * menekan tombol bersamaan tidak bisa melunasi tagihan yang sama dua kali,
 * dan pembayaran, status tagihan, kas, kuitansi, serta audit log berhasil
 * atau gagal bersama-sama.
 *
 * Status tagihan HANYA berubah menjadi PAID di sini, dan hanya setelah
 * pembayaran terverifikasi.
 */

/** Galat yang pesannya aman ditampilkan ke pengguna. */
class GalatBisnis extends Error {}

const kunciTagihan = (tx: Prisma.TransactionClient, id: string) =>
  tx.$queryRaw`SELECT id FROM tagihan WHERE id = ${id}::uuid FOR UPDATE`;
const kunciPembayaran = (tx: Prisma.TransactionClient, id: string) =>
  tx.$queryRaw`SELECT id FROM pembayaran WHERE id = ${id}::uuid FOR UPDATE`;

const muatUlang = () => {
  revalidatePath("/admin/tagihan");
  revalidatePath("/admin/pembayaran");
  revalidatePath("/admin/kas");
  revalidatePath("/admin/tagihan-saya");
};

function ubahGalat(e: unknown, cadangan: string): { ok: false; pesan: string } {
  if (e instanceof GalatBisnis) return { ok: false, pesan: e.message };
  console.error("[pembayaran]", cadangan, e);
  return { ok: false, pesan: cadangan };
}

type Aktor = { id: string; nama: string };

/**
 * Melunasi tagihan: tagihan UNPAID -> PAID, kas masuk, dan kuitansi. Dipanggil
 * di dalam transaksi setelah pembayaran dinyatakan sah. Bila tagihan sudah
 * tidak UNPAID (dibatalkan atau sudah lunas), seluruh transaksi digagalkan.
 */
async function lunasi(
  tx: Prisma.TransactionClient,
  p: {
    pembayaranId: string;
    tagihan: { id: string; judul: string; nominal: Prisma.Decimal; rumah: { blok: string; nomor: string } };
    tanggal: Date;
    aktor: Aktor;
  },
) {
  const naik = await tx.tagihan.updateMany({
    where: { id: p.tagihan.id, status: "UNPAID" },
    data: { status: "PAID" },
  });
  if (naik.count !== 1) {
    throw new GalatBisnis("Tagihan ini sudah tidak bisa dibayar (sudah lunas atau dibatalkan).");
  }

  const kategoriId = await kategoriWajib(tx, KATEGORI_IURAN, "MASUK");
  await tx.transaksiKas.create({
    data: {
      nomor: await nomorBerikut(tx, "KAS"),
      jenis: "MASUK",
      kategoriId,
      nominal: p.tagihan.nominal,
      tanggal: p.tanggal,
      deskripsi: `${p.tagihan.judul} · rumah ${kodeRumah(p.tagihan.rumah)}`,
      pembayaranId: p.pembayaranId,
      dicatatOleh: p.aktor.nama,
    },
  });
  return tx.kuitansi.create({
    data: { nomor: await nomorBerikut(tx, "KWT"), pembayaranId: p.pembayaranId },
    select: { id: true, nomor: true },
  });
}

/** Bendahara mencatat pembayaran tunai. Langsung sah: lunas, kas, dan kuitansi. */
export async function catatTunai(tagihanId: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("payments.record_cash");
  if (!cek.ok) return cek;
  const aktor = { id: cek.sesi.user.id, nama: cek.sesi.user.name };

  const h = tunaiMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const k = await db().$transaction(async (tx) => {
      await kunciTagihan(tx, tagihanId);
      const t = await tx.tagihan.findUnique({
        where: { id: tagihanId },
        select: { id: true, judul: true, nominal: true, status: true, rumahId: true, rumah: { select: { blok: true, nomor: true } } },
      });
      if (!t) throw new GalatBisnis("Tagihan tidak ditemukan.");
      if (t.status !== "UNPAID") throw new GalatBisnis("Tagihan ini sudah lunas atau dibatalkan.");
      if (await tx.pembayaran.count({ where: { tagihanId, status: "PENDING" } })) {
        throw new GalatBisnis("Ada pembayaran transfer yang menunggu verifikasi untuk tagihan ini. Verifikasi atau tolak dulu.");
      }

      const p = await tx.pembayaran.create({
        data: {
          tagihanId,
          metode: "TUNAI",
          status: "VERIFIED",
          nominal: t.nominal,
          tanggalBayar: tanggalUtc(h.data.tanggalBayar),
          dibayarOleh: h.data.dibayarOleh,
          catatan: h.data.catatan,
          diverifikasiOleh: aktor.nama,
          diverifikasiPada: new Date(),
        },
      });
      const kw = await lunasi(tx, {
        pembayaranId: p.id,
        tagihan: t,
        tanggal: tanggalUtc(h.data.tanggalBayar),
        aktor,
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: aktor.id,
          aktorNama: aktor.nama,
          aksi: "pembayaran.tunai",
          entitas: "pembayaran",
          entitasId: p.id,
          metadata: { tagihanId, kuitansi: kw.nomor },
        }),
      });
      return { ...kw, rumahId: t.rumahId, judul: t.judul };
    });
    const penghuni = (await userIdPerRumah([k.rumahId])).get(k.rumahId) ?? [];
    await beriNotifikasiAman({
      userIds: penghuni,
      jenis: "bayar-tunai",
      judul: "Pembayaran tunai diterima",
      isi: `${k.judul} sudah lunas. Kuitansi ${k.nomor} terbit.`,
      tautan: `/admin/kuitansi/${k.id}`,
      kunci: `bayar-tunai:${k.id}`,
    });
    muatUlang();
    return { ok: true, id: k.id };
  } catch (e) {
    return ubahGalat(e, "Gagal mencatat pembayaran.");
  }
}

/**
 * Warga mengajukan pembayaran transfer dengan bukti. Statusnya PENDING: tagihan
 * BELUM lunas sampai bendahara memverifikasi. Bukti transfer bukan bukti
 * dana sudah diterima.
 */
export async function ajukanTransfer(tagihanId: string, formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("payments.create.own");
  if (!cek.ok) return cek;

  const h = transferMasuk.safeParse({
    tanggalBayar: formData.get("tanggalBayar") ?? "",
    catatan: formData.get("catatan") ?? "",
  });
  if (!h.success) return galatDariZod(h.error);

  const berkas = await periksaBerkas(formData.get("bukti"));
  if (!berkas.ok) return { ok: false, pesan: berkas.pesan, galat: { bukti: berkas.pesan } };

  // Tagihan harus milik rumah si pengaju. Dicari dari ID akun, bukan dari input.
  const rumahId = await rumahIdMilik(cek.sesi.user.id);
  if (!rumahId) return { ok: false, pesan: "Akun Anda belum dihubungkan ke rumah yang masih ditempati." };

  try {
    await db().$transaction(async (tx) => {
      await kunciTagihan(tx, tagihanId);
      const t = await tx.tagihan.findUnique({
        where: { id: tagihanId },
        select: { rumahId: true, status: true, nominal: true },
      });
      if (!t || t.rumahId !== rumahId) throw new GalatBisnis("Tagihan tidak ditemukan.");
      if (t.status !== "UNPAID") throw new GalatBisnis("Tagihan ini sudah lunas atau dibatalkan.");
      if (await tx.pembayaran.count({ where: { tagihanId, status: "PENDING" } })) {
        throw new GalatBisnis("Pembayaran untuk tagihan ini sedang menunggu verifikasi bendahara.");
      }

      const p = await tx.pembayaran.create({
        data: {
          tagihanId,
          metode: "TRANSFER",
          status: "PENDING",
          nominal: t.nominal,
          tanggalBayar: tanggalUtc(h.data.tanggalBayar),
          dibayarOleh: cek.sesi.user.name,
          diajukanOlehId: cek.sesi.user.id,
          catatan: h.data.catatan,
          bukti: {
            create: { namaBerkas: berkas.nama, tipe: berkas.tipe, ukuran: berkas.data.length, data: berkas.data },
          },
        },
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: "pembayaran.ajukan_transfer",
          entitas: "pembayaran",
          entitasId: p.id,
          metadata: { tagihanId, tipeBukti: berkas.tipe, ukuran: berkas.data.length },
        }),
      });
      return p.id;
    }).then(async (pembayaranId) => {
      const bendahara = await db().user.findMany({ where: { role: "bendahara", banned: { not: true } }, select: { id: true } });
      await beriNotifikasiAman({
        userIds: [...bendahara.map((b) => b.id), ...(await userIdAdmin())],
        jenis: "bayar-menunggu",
        judul: "Pembayaran menunggu verifikasi",
        isi: `${cek.sesi.user.name} mengirim bukti transfer.`,
        tautan: "/admin/pembayaran",
        kunci: `bayar-menunggu:${pembayaranId}`,
      });
    });
    muatUlang();
    return { ok: true };
  } catch (e) {
    return ubahGalat(e, "Gagal mengirim pembayaran.");
  }
}

/** Bendahara menyetujui transfer: tagihan lunas, kas masuk, kuitansi terbit. */
export async function verifikasiPembayaran(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("payments.verify");
  if (!cek.ok) return cek;
  const aktor = { id: cek.sesi.user.id, nama: cek.sesi.user.name };

  try {
    const kw = await db().$transaction(async (tx) => {
      await kunciPembayaran(tx, id);
      const p = await tx.pembayaran.findUnique({
        where: { id },
        select: {
          status: true,
          tanggalBayar: true,
          diajukanOlehId: true,
          tagihan: { select: { id: true, judul: true, nominal: true, rumah: { select: { blok: true, nomor: true } } } },
        },
      });
      if (!p) throw new GalatBisnis("Pembayaran tidak ditemukan.");
      if (p.status !== "PENDING") throw new GalatBisnis("Pembayaran ini sudah diproses.");

      await tx.pembayaran.update({
        where: { id },
        data: { status: "VERIFIED", diverifikasiOleh: aktor.nama, diverifikasiPada: new Date() },
      });
      const kuit = await lunasi(tx, { pembayaranId: id, tagihan: p.tagihan, tanggal: p.tanggalBayar, aktor });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: aktor.id,
          aktorNama: aktor.nama,
          aksi: "pembayaran.verifikasi",
          entitas: "pembayaran",
          entitasId: id,
          metadata: { kuitansi: kuit.nomor },
        }),
      });
      return { ...kuit, pengaju: p.diajukanOlehId, judul: p.tagihan.judul };
    });
    if (kw.pengaju) {
      await beriNotifikasiAman({
        userIds: [kw.pengaju],
        jenis: "bayar-disetujui",
        judul: "Pembayaran disetujui",
        isi: `${kw.judul} sudah lunas. Kuitansi ${kw.nomor} terbit.`,
        tautan: `/admin/kuitansi/${kw.id}`,
        kunci: `bayar-ok:${id}`,
      });
    }
    muatUlang();
    return { ok: true, id: kw.id };
  } catch (e) {
    return ubahGalat(e, "Gagal memverifikasi pembayaran.");
  }
}

/** Bendahara menolak transfer dengan alasan. Warga boleh mengirim ulang. */
export async function tolakPembayaran(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("payments.verify");
  if (!cek.ok) return cek;

  const h = alasanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const r = await db().pembayaran.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: "REJECTED",
        alasanTolak: h.data.alasan,
        diverifikasiOleh: cek.sesi.user.name,
        diverifikasiPada: new Date(),
      },
    });
    if (r.count === 0) return { ok: false, pesan: "Pembayaran ini sudah diproses." };
    const ditolak = await db().pembayaran.findUnique({ where: { id }, select: { diajukanOlehId: true, tagihan: { select: { judul: true } } } });
    if (ditolak?.diajukanOlehId) {
      await beriNotifikasiAman({
        userIds: [ditolak.diajukanOlehId],
        jenis: "bayar-ditolak",
        judul: "Pembayaran ditolak",
        isi: `${ditolak.tagihan.judul}: ${h.data.alasan}`,
        tautan: "/admin/tagihan-saya",
        kunci: `bayar-tolak:${id}`,
      });
    }
    await db().auditLog.create({
      data: dataAudit({
        aktorId: cek.sesi.user.id,
        aktorNama: cek.sesi.user.name,
        aksi: "pembayaran.tolak",
        entitas: "pembayaran",
        entitasId: id,
        metadata: { alasan: h.data.alasan },
      }),
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menolak pembayaran.");
  }
}

/**
 * Membatalkan pembayaran yang SUDAH terverifikasi (salah catat). Tagihan
 * kembali UNPAID, dan kas dikoreksi dengan transaksi pembalik. Transaksi
 * aslinya tidak diubah atau dihapus.
 */
export async function batalkanPembayaran(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("payments.verify");
  if (!cek.ok) return cek;
  const aktor = { id: cek.sesi.user.id, nama: cek.sesi.user.name };

  const h = alasanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    await db().$transaction(async (tx) => {
      await kunciPembayaran(tx, id);
      const p = await tx.pembayaran.findUnique({
        where: { id },
        select: { status: true, tagihanId: true, kuitansi: { select: { nomor: true } }, transaksi: { select: { id: true, nominal: true, nomor: true } } },
      });
      if (!p) throw new GalatBisnis("Pembayaran tidak ditemukan.");
      if (p.status !== "VERIFIED" || !p.transaksi) throw new GalatBisnis("Hanya pembayaran yang sudah terverifikasi yang bisa dibatalkan.");

      await tx.pembayaran.update({
        where: { id },
        data: {
          status: "VOIDED",
          dibatalkanAlasan: h.data.alasan,
          dibatalkanOleh: aktor.nama,
          dibatalkanPada: new Date(),
        },
      });
      const buka = await tx.tagihan.updateMany({
        where: { id: p.tagihanId, status: "PAID" },
        data: { status: "UNPAID" },
      });
      if (buka.count !== 1) throw new GalatBisnis("Status tagihan tidak sesuai. Pembatalan dihentikan.");

      await tx.transaksiKas.create({
        data: {
          nomor: await nomorBerikut(tx, "KAS"),
          jenis: "KELUAR",
          kategoriId: await kategoriWajib(tx, KATEGORI_KOREKSI, "KELUAR"),
          nominal: p.transaksi.nominal,
          tanggal: tanggalUtc(hariIni()),
          deskripsi: `Pembatalan pembayaran ${p.kuitansi?.nomor ?? ""} (${p.transaksi.nomor}): ${h.data.alasan}`.trim(),
          koreksiDariId: p.transaksi.id,
          dicatatOleh: aktor.nama,
        },
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: aktor.id,
          aktorNama: aktor.nama,
          aksi: "pembayaran.batalkan",
          entitas: "pembayaran",
          entitasId: id,
          metadata: { alasan: h.data.alasan, kuitansi: p.kuitansi?.nomor ?? null },
        }),
      });
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal membatalkan pembayaran.");
  }
}
