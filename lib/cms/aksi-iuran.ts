"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import {
  jenisIuranBaru,
  jenisIuranUbah,
  nominalBaru,
} from "@/lib/cms/skema-iuran";
import { tanggalUtc } from "@/lib/uang";

/**
 * Aksi jenis iuran dan nominalnya. Perlu izin `dues.manage` (Admin dan
 * Bendahara). Nominal tidak pernah diubah di tempat: perubahan menambah
 * baris aturan baru, sehingga riwayatnya utuh.
 */

const P2002 = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

const PESAN_NAMA_GANDA = "Sudah ada iuran dengan nama itu.";

export async function buatJenisIuran(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("dues.manage");
  if (!cek.ok) return cek;

  const h = jenisIuranBaru.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const { nominal, berlakuMulai, ...data } = h.data;

  try {
    const j = await db().jenisIuran.create({
      data: {
        ...data,
        aturan: {
          create: {
            nominal,
            berlakuMulai: tanggalUtc(berlakuMulai),
            dibuatOleh: cek.sesi.user.name,
          },
        },
      },
    });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "iuran.buat",
      entitas: "jenis_iuran",
      entitasId: j.id,
      metadata: { nama: j.nama, nominal, frekuensi: j.frekuensi },
    });
    revalidatePath("/admin/iuran");
    return { ok: true, id: j.id };
  } catch (e) {
    if (P2002(e)) return { ok: false, pesan: PESAN_NAMA_GANDA, galat: { nama: PESAN_NAMA_GANDA } };
    console.error("[iuran] gagal membuat:", e);
    return { ok: false, pesan: "Gagal menyimpan jenis iuran." };
  }
}

export async function ubahJenisIuran(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("dues.manage");
  if (!cek.ok) return cek;

  const h = jenisIuranUbah.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const lama = await db().jenisIuran.findUnique({
      where: { id },
      select: { frekuensi: true, _count: { select: { tagihan: true } } },
    });
    if (!lama) return { ok: false, pesan: "Jenis iuran tidak ditemukan." };

    // Mengganti frekuensi setelah ada tagihan membuat format periode lama tidak lagi cocok.
    if (lama.frekuensi !== h.data.frekuensi && lama._count.tagihan > 0) {
      const pesan = "Frekuensi tidak bisa diubah karena iuran ini sudah punya tagihan. Buat jenis iuran baru.";
      return { ok: false, pesan, galat: { frekuensi: pesan } };
    }

    await db().jenisIuran.update({ where: { id }, data: h.data });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "iuran.ubah",
      entitas: "jenis_iuran",
      entitasId: id,
      metadata: { aktif: h.data.aktif, terbitOtomatis: h.data.terbitOtomatis },
    });
    revalidatePath("/admin/iuran");
    return { ok: true, id };
  } catch (e) {
    if (P2002(e)) return { ok: false, pesan: PESAN_NAMA_GANDA, galat: { nama: PESAN_NAMA_GANDA } };
    console.error("[iuran] gagal mengubah:", e);
    return { ok: false, pesan: "Gagal menyimpan perubahan." };
  }
}

/** Menambah nominal baru yang berlaku mulai tanggal tertentu. */
export async function ubahNominalIuran(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("dues.manage");
  if (!cek.ok) return cek;

  const h = nominalBaru.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    await db().aturanIuran.create({
      data: {
        jenisIuranId: id,
        nominal: h.data.nominal,
        berlakuMulai: tanggalUtc(h.data.berlakuMulai),
        dibuatOleh: cek.sesi.user.name,
      },
    });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "iuran.ubah_nominal",
      entitas: "jenis_iuran",
      entitasId: id,
      metadata: { nominal: h.data.nominal, berlakuMulai: h.data.berlakuMulai },
    });
    revalidatePath("/admin/iuran");
    return { ok: true, id };
  } catch (e) {
    if (P2002(e)) {
      const pesan = "Sudah ada nominal yang berlaku mulai tanggal itu. Pilih tanggal lain.";
      return { ok: false, pesan, galat: { berlakuMulai: pesan } };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { ok: false, pesan: "Jenis iuran tidak ditemukan." };
    }
    console.error("[iuran] gagal mengubah nominal:", e);
    return { ok: false, pesan: "Gagal menyimpan nominal." };
  }
}
