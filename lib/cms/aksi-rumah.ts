"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { keluargaMasuk, rumahMasuk } from "@/lib/cms/skema-warga";
import { kodeRumah } from "@/lib/warga-label";

/**
 * Aksi rumah dan keluarga. Menulis memerlukan `residents.create` atau
 * `residents.update` (Admin). Setiap aksi dicatat ke audit log.
 */

const sudahAda = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
const dipakai = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";

export async function buatRumah(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.create");
  if (!cek.ok) return cek;

  const h = rumahMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const r = await db().rumah.create({ data: h.data });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "rumah.buat",
      entitas: "rumah",
      entitasId: r.id,
      metadata: { kode: kodeRumah(r) },
    });
    revalidatePath("/admin/rumah");
    return { ok: true, id: r.id };
  } catch (e) {
    if (sudahAda(e)) {
      return {
        ok: false,
        pesan: "Rumah dengan blok dan nomor itu sudah terdaftar.",
        galat: { nomor: "Nomor ini sudah dipakai pada blok yang sama." },
      };
    }
    console.error("[rumah] gagal membuat:", e);
    return { ok: false, pesan: "Gagal menyimpan rumah." };
  }
}

export async function ubahRumah(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.update");
  if (!cek.ok) return cek;

  const h = rumahMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const r = await db().rumah.update({ where: { id }, data: h.data });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "rumah.ubah",
      entitas: "rumah",
      entitasId: id,
      metadata: { kode: kodeRumah(r) },
    });
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id };
  } catch (e) {
    if (sudahAda(e)) {
      return {
        ok: false,
        pesan: "Rumah dengan blok dan nomor itu sudah terdaftar.",
        galat: { nomor: "Nomor ini sudah dipakai pada blok yang sama." },
      };
    }
    console.error("[rumah] gagal mengubah:", e);
    return { ok: false, pesan: "Gagal menyimpan perubahan rumah." };
  }
}

/** Hanya rumah yang belum punya keluarga. Foreign key RESTRICT menjaga sisanya. */
export async function hapusRumah(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.update");
  if (!cek.ok) return cek;

  try {
    const r = await db().rumah.delete({ where: { id } });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "rumah.hapus",
      entitas: "rumah",
      entitasId: id,
      metadata: { kode: kodeRumah(r) },
    });
    revalidatePath("/admin/rumah");
    return { ok: true, id };
  } catch (e) {
    if (dipakai(e)) {
      return {
        ok: false,
        pesan: "Rumah ini masih memiliki data keluarga. Pindahkan atau hapus keluarganya lebih dulu.",
      };
    }
    console.error("[rumah] gagal menghapus:", e);
    return { ok: false, pesan: "Gagal menghapus rumah." };
  }
}

export async function buatKeluarga(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.create");
  if (!cek.ok) return cek;

  const h = keluargaMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const k = await db().keluarga.create({ data: h.data });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "keluarga.buat",
      entitas: "keluarga",
      entitasId: k.id,
      metadata: { rumahId: k.rumahId, statusHunian: k.statusHunian },
    });
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id: k.id };
  } catch (e) {
    if (dipakai(e)) return { ok: false, pesan: "Rumah tidak ditemukan." };
    console.error("[keluarga] gagal membuat:", e);
    return { ok: false, pesan: "Gagal menyimpan keluarga." };
  }
}

export async function ubahKeluarga(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.update");
  if (!cek.ok) return cek;

  const h = keluargaMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const { rumahId: _tidakDiubah, ...data } = h.data;
    void _tidakDiubah;
    await db().$transaction(async (tx) => {
      const k = await tx.keluarga.update({ where: { id }, data });
      // Keluarga yang sudah pindah: seluruh anggota aktifnya ikut berstatus pindah.
      if (k.tanggalKeluar) {
        await tx.warga.updateMany({
          where: { keluargaId: id, statusDomisili: "AKTIF" },
          data: { statusDomisili: "PINDAH" },
        });
      }
    });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "keluarga.ubah",
      entitas: "keluarga",
      entitasId: id,
    });
    revalidatePath("/admin/rumah", "layout");
    revalidatePath("/admin/warga", "layout");
    return { ok: true, id };
  } catch (e) {
    console.error("[keluarga] gagal mengubah:", e);
    return { ok: false, pesan: "Gagal menyimpan perubahan keluarga." };
  }
}

export async function hapusKeluarga(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.update");
  if (!cek.ok) return cek;

  try {
    const jumlah = await db().warga.count({ where: { keluargaId: id } });
    if (jumlah > 0) {
      return {
        ok: false,
        pesan: `Keluarga ini masih memiliki ${jumlah} anggota. Hapus anggotanya lebih dulu, atau tandai keluarga sudah pindah.`,
      };
    }
    await db().keluarga.delete({ where: { id } });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "keluarga.hapus",
      entitas: "keluarga",
      entitasId: id,
    });
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id };
  } catch (e) {
    console.error("[keluarga] gagal menghapus:", e);
    return { ok: false, pesan: "Gagal menghapus keluarga." };
  }
}
