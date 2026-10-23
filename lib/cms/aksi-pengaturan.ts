"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { pengaturanRtMasuk } from "@/lib/cms/skema";

/** Menyimpan identitas dan rekening RT. Izin: `settings.manage` (Admin). */
export async function simpanPengaturanRt(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("settings.manage");
  if (!cek.ok) return cek;

  const hasil = pengaturanRtMasuk.safeParse(mentah);
  if (!hasil.success) return galatDariZod(hasil.error);

  try {
    await db().pengaturanRt.upsert({
      where: { id: "rt" },
      create: { id: "rt", ...hasil.data },
      update: hasil.data,
    });
    // Nomor rekening tidak ikut metadata: cukup tahu bahwa ia berubah.
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "pengaturan.ubah",
      entitas: "pengaturan_rt",
      entitasId: "rt",
    });
    revalidatePath("/", "layout");
    return { ok: true, id: "rt" };
  } catch (e) {
    console.error("[pengaturan] gagal menyimpan:", e);
    return { ok: false, pesan: "Gagal menyimpan pengaturan." };
  }
}
