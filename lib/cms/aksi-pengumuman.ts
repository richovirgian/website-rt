"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { periksaIzinAksi, sesi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { ubahGalat } from "@/lib/galat-bisnis";
import { periksaLampiran } from "@/lib/lampiran";
import { umumkan } from "@/lib/umumkan";
import { pengumumanMasuk } from "@/lib/cms/skema-komunikasi";
import { waktuJakarta } from "@/lib/komunikasi-label";

/**
 * Aksi pengumuman. Mengelola perlu `announcements.manage` (Admin). Siapa pun
 * yang sudah masuk boleh membaca dan menandai dibaca. Pengumuman terjadwal
 * (terbit di masa depan) tidak terlihat sampai waktunya, dan notifikasinya
 * dikirim oleh penjadwal harian.
 */

const muatUlang = () => {
  revalidatePath("/admin/pengumuman", "layout");
  revalidatePath("/admin");
};

export async function simpanPengumuman(id: string | null, formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("announcements.manage");
  if (!cek.ok) return cek;

  const h = pengumumanMasuk.safeParse({
    judul: formData.get("judul") ?? "",
    isi: formData.get("isi") ?? "",
    kategori: formData.get("kategori") ?? "",
    mode: formData.get("mode") ?? "DRAFT",
    tanggalTerbit: formData.get("tanggalTerbit") ?? "",
    jamTerbit: formData.get("jamTerbit") ?? "",
    disematkan: formData.get("disematkan") === "on",
  });
  if (!h.success) return galatDariZod(h.error);
  const d = h.data;

  const lamp = await periksaLampiran(formData);
  if (!lamp.ok) return { ok: false, pesan: lamp.pesan, galat: { lampiran: lamp.pesan } };

  if (d.mode === "TETAP" && !id) return { ok: false, pesan: "Pilih cara menerbitkan pengumuman." };

  const sekarang = new Date();
  const jadwal = d.mode === "JADWAL" ? waktuJakarta(d.tanggalTerbit, d.jamTerbit) : null;
  // Jadwal yang sudah lewat diperlakukan sebagai "terbitkan sekarang".
  const terbitPada = d.mode === "DRAFT" || d.mode === "TETAP" ? null : jadwal && jadwal > sekarang ? jadwal : sekarang;
  const data = {
    judul: d.judul,
    isi: d.isi,
    kategori: d.kategori,
    disematkan: d.disematkan,
    // TETAP: status dan waktu terbit sengaja tidak disentuh.
    ...(d.mode === "TETAP" ? {} : { status: d.mode === "DRAFT" ? ("DRAFT" as const) : ("TERBIT" as const), terbitPada }),
  };

  try {
    const p = await db().$transaction(async (tx) => {
      const simpan = id
        ? await tx.pengumuman.update({
            where: { id },
            data: {
              ...data,
              // Jadwal diubah ke masa depan: notifikasi akan dikirim ulang pada waktunya.
              ...(terbitPada && terbitPada > sekarang ? { notifikasiTerkirim: false } : {}),
              ...(lamp.berkas.length ? { lampiran: { create: lamp.berkas } } : {}),
            },
          })
        : await tx.pengumuman.create({ data: { ...data, penulis: cek.sesi.user.name, lampiran: { create: lamp.berkas } } });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: id ? "pengumuman.ubah" : "pengumuman.buat",
          entitas: "pengumuman",
          entitasId: simpan.id,
          metadata: { mode: d.mode, kategori: data.kategori, terjadwal: !!(terbitPada && terbitPada > sekarang) },
        }),
      });
      return simpan;
    });
    if (p.status === "TERBIT" && p.terbitPada && p.terbitPada <= new Date()) await umumkan(p.id);
    muatUlang();
    return { ok: true, id: p.id };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan pengumuman.", "pengumuman");
  }
}

export async function hapusPengumuman(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("announcements.manage");
  if (!cek.ok) return cek;
  try {
    const p = await db().pengumuman.delete({ where: { id }, select: { judul: true } });
    await db().auditLog.create({
      data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi: "pengumuman.hapus", entitas: "pengumuman", entitasId: id, metadata: { judul: p.judul } }),
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menghapus pengumuman.", "pengumuman");
  }
}

export async function hapusLampiranPengumuman(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("announcements.manage");
  if (!cek.ok) return cek;
  try {
    // Hanya lampiran milik pengumuman yang dihapus: lampiran surat dan pengaduan tidak tersentuh.
    const r = await db().lampiran.deleteMany({ where: { id, pengumumanId: { not: null } } });
    if (r.count !== 1) return { ok: false, pesan: "Lampiran tidak ditemukan." };
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menghapus lampiran.", "pengumuman");
  }
}

/** Menandai pengumuman sudah dibaca oleh pengguna yang sedang masuk. Hanya yang terlihat. */
export async function tandaiPengumumanDibaca(id: string): Promise<void> {
  const s = await sesi();
  if (!s) return;
  const p = await db().pengumuman.findFirst({
    where: { id, status: "TERBIT", terbitPada: { lte: new Date() } },
    select: { id: true },
  });
  if (!p) return;
  await db().pengumumanDibaca.upsert({
    where: { pengumumanId_userId: { pengumumanId: id, userId: s.user.id } },
    create: { pengumumanId: id, userId: s.user.id },
    update: {},
  });
  revalidatePath("/admin", "layout");
}
