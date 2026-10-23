"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { alasanMasuk, kasMasuk, kategoriMasuk } from "@/lib/cms/skema-pembayaran";
import { kategoriManual, kategoriWajib, KATEGORI_KOREKSI } from "@/lib/kas";
import { nomorBerikut } from "@/lib/nomor";
import { hariIni, tanggalUtc } from "@/lib/uang";

/**
 * Aksi buku kas manual: pengeluaran, pemasukan di luar iuran (donasi, dan
 * sebagainya), dan koreksi. Perlu `finance.create` atau `finance.reverse`
 * (Bendahara). Kas masuk dari iuran tidak dibuat di sini: itu hanya lahir
 * dari pembayaran terverifikasi.
 */

class GalatBisnis extends Error {}
const P2002 = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function catatKas(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("finance.create");
  if (!cek.ok) return cek;

  const h = kasMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const d = h.data;

  try {
    await db().$transaction(async (tx) => {
      const k = await tx.kategoriKas.findUnique({ where: { id: d.kategoriId } });
      if (!k || !k.aktif || k.jenis !== d.jenis || !kategoriManual(k.nama)) {
        throw new GalatBisnis("Kategori tidak sesuai dengan jenis transaksi.");
      }
      const t = await tx.transaksiKas.create({
        data: {
          nomor: await nomorBerikut(tx, "KAS"),
          jenis: d.jenis,
          kategoriId: d.kategoriId,
          nominal: d.nominal,
          tanggal: tanggalUtc(d.tanggal),
          deskripsi: d.deskripsi,
          dicatatOleh: cek.sesi.user.name,
        },
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: "kas.catat",
          entitas: "transaksi_kas",
          entitasId: t.id,
          metadata: { nomor: t.nomor, jenis: d.jenis, nominal: d.nominal, kategori: k.nama },
        }),
      });
    });
    revalidatePath("/admin/kas");
    return { ok: true };
  } catch (e) {
    if (e instanceof GalatBisnis) return { ok: false, pesan: e.message, galat: { kategoriId: e.message } };
    console.error("[kas] gagal mencatat:", e);
    return { ok: false, pesan: "Gagal mencatat transaksi." };
  }
}

/**
 * Koreksi transaksi manual dengan transaksi pembalik. Transaksi asal tidak
 * disentuh. Transaksi dari pembayaran dikoreksi lewat "batalkan pembayaran",
 * dan transaksi pembalik sendiri tidak bisa dikoreksi lagi.
 */
export async function koreksiKas(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("finance.reverse");
  if (!cek.ok) return cek;

  const h = alasanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    await db().$transaction(async (tx) => {
      const asal = await tx.transaksiKas.findUnique({ where: { id } });
      if (!asal) throw new GalatBisnis("Transaksi tidak ditemukan.");
      if (asal.pembayaranId) throw new GalatBisnis("Transaksi ini berasal dari pembayaran. Batalkan lewat halaman Pembayaran.");
      if (asal.koreksiDariId) throw new GalatBisnis("Transaksi pembalik tidak bisa dikoreksi lagi.");

      const balik = asal.jenis === "MASUK" ? "KELUAR" : "MASUK";
      // Unik pada koreksi_dari_id: koreksi ganda gagal dengan P2002, bukan menghasilkan dua pembalik.
      const t = await tx.transaksiKas.create({
        data: {
          nomor: await nomorBerikut(tx, "KAS"),
          jenis: balik,
          kategoriId: await kategoriWajib(tx, KATEGORI_KOREKSI, balik),
          nominal: asal.nominal,
          tanggal: tanggalUtc(hariIni()),
          deskripsi: `Koreksi ${asal.nomor}: ${h.data.alasan}`,
          koreksiDariId: asal.id,
          dicatatOleh: cek.sesi.user.name,
        },
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: "kas.koreksi",
          entitas: "transaksi_kas",
          entitasId: t.id,
          metadata: { asal: asal.nomor, alasan: h.data.alasan },
        }),
      });
    });
    revalidatePath("/admin/kas");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof GalatBisnis) return { ok: false, pesan: e.message };
    if (P2002(e)) return { ok: false, pesan: "Transaksi ini sudah pernah dikoreksi." };
    console.error("[kas] gagal mengoreksi:", e);
    return { ok: false, pesan: "Gagal mengoreksi transaksi." };
  }
}

export async function tambahKategoriKas(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("finance.create");
  if (!cek.ok) return cek;

  const h = kategoriMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  if (!kategoriManual(h.data.nama)) {
    const pesan = "Nama itu dipakai sistem. Pilih nama lain.";
    return { ok: false, pesan, galat: { nama: pesan } };
  }

  try {
    const k = await db().kategoriKas.create({ data: h.data });
    await db().auditLog.create({
      data: dataAudit({
        aktorId: cek.sesi.user.id,
        aktorNama: cek.sesi.user.name,
        aksi: "kas.kategori_baru",
        entitas: "kategori_kas",
        entitasId: k.id,
        metadata: { nama: k.nama, jenis: k.jenis },
      }),
    });
    revalidatePath("/admin/kas");
    return { ok: true, id: k.id };
  } catch (e) {
    if (P2002(e)) {
      const pesan = "Kategori itu sudah ada.";
      return { ok: false, pesan, galat: { nama: pesan } };
    }
    console.error("[kas] gagal menambah kategori:", e);
    return { ok: false, pesan: "Gagal menambah kategori." };
  }
}
