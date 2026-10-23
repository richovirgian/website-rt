"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { periksaIzinAksi, sesi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { ubahGalat } from "@/lib/galat-bisnis";
import { beriNotifikasiAman, userIdSemua } from "@/lib/notifikasi";
import { kegiatanMasuk } from "@/lib/cms/skema-komunikasi";
import { waktuJakarta } from "@/lib/komunikasi-label";

/**
 * Aksi kalender kegiatan. Mengelola perlu `events.manage` (Admin). Siapa pun
 * yang masuk boleh melihat dan mengonfirmasi ikut atau tidak.
 */

const muatUlang = () => {
  revalidatePath("/admin/kegiatan", "layout");
  revalidatePath("/admin");
};

export async function simpanKegiatan(id: string | null, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("events.manage");
  if (!cek.ok) return cek;
  const h = kegiatanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const d = h.data;

  const data = {
    judul: d.judul,
    deskripsi: d.deskripsi,
    jenis: d.jenis,
    mulai: waktuJakarta(d.tanggal, d.jamMulai),
    selesai: d.jamSelesai ? waktuJakarta(d.tanggal, d.jamSelesai) : null,
    lokasi: d.lokasi,
    penanggungJawab: d.penanggungJawab,
  };

  try {
    const k = id
      ? await db().kegiatan.update({ where: { id }, data })
      : await db().kegiatan.create({ data: { ...data, dibuatOleh: cek.sesi.user.name } });
    await db().auditLog.create({
      data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi: id ? "kegiatan.ubah" : "kegiatan.buat", entitas: "kegiatan", entitasId: k.id, metadata: { judul: k.judul } }),
    });
    if (!id) {
      await beriNotifikasiAman({
        userIds: await userIdSemua(),
        jenis: "kegiatan-baru",
        judul: "Kegiatan baru",
        isi: k.judul,
        tautan: `/admin/kegiatan/${k.id}`,
        kunci: `kegiatan-baru:${k.id}`,
      });
    }
    muatUlang();
    return { ok: true, id: k.id };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan kegiatan.", "kegiatan");
  }
}

export async function batalkanKegiatan(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("events.manage");
  if (!cek.ok) return cek;
  try {
    const r = await db().kegiatan.updateMany({ where: { id, status: "DIJADWALKAN" }, data: { status: "DIBATALKAN" } });
    if (r.count !== 1) return { ok: false, pesan: "Kegiatan ini sudah dibatalkan atau selesai." };
    const k = await db().kegiatan.findUnique({ where: { id }, select: { judul: true } });
    await db().auditLog.create({
      data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi: "kegiatan.batalkan", entitas: "kegiatan", entitasId: id }),
    });
    await beriNotifikasiAman({
      userIds: await userIdSemua(),
      jenis: "kegiatan-batal",
      judul: "Kegiatan dibatalkan",
      isi: k?.judul ?? "Sebuah kegiatan dibatalkan.",
      tautan: `/admin/kegiatan/${id}`,
      kunci: `kegiatan-batal:${id}`,
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal membatalkan kegiatan.", "kegiatan");
  }
}

/** Mengonfirmasi ikut (true) atau tidak ikut (false). Hanya untuk kegiatan yang akan datang. */
export async function konfirmasiHadir(kegiatanId: string, hadir: boolean): Promise<HasilAksi> {
  const s = await sesi();
  if (!s) return { ok: false, pesan: "Sesi telah berakhir. Silakan masuk kembali." };
  try {
    const k = await db().kegiatan.findFirst({
      where: { id: kegiatanId, status: "DIJADWALKAN", mulai: { gt: new Date() } },
      select: { id: true },
    });
    if (!k) return { ok: false, pesan: "Kegiatan ini sudah lewat atau dibatalkan." };
    await db().pesertaKegiatan.upsert({
      where: { kegiatanId_userId: { kegiatanId, userId: s.user.id } },
      create: { kegiatanId, userId: s.user.id, hadir },
      update: { hadir },
    });
    muatUlang();
    return { ok: true, id: kegiatanId };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan konfirmasi.", "kegiatan");
  }
}
