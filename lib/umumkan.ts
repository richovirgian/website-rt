import { db } from "@/lib/db";
import { beriNotifikasiAman, userIdSemua } from "@/lib/notifikasi";

/**
 * Memberi notifikasi pengumuman ke semua akun, SEKALI saja.
 *
 * Sengaja di modul biasa, bukan di berkas "use server": fungsi yang diekspor
 * dari berkas "use server" menjadi titik masuk yang bisa dipanggil klien
 * tanpa pemeriksaan izin. Fungsi ini hanya boleh dipanggil dari kode server
 * (aksi Admin dan penjadwal).
 *
 * Hanya pengumuman yang SUDAH terbit dan waktunya sudah tiba yang
 * diumumkan, jadi draf dan pengumuman terjadwal tidak pernah bocor.
 */
export async function umumkan(id: string): Promise<void> {
  const p = await db().pengumuman.findFirst({
    where: { id, status: "TERBIT", terbitPada: { lte: new Date() }, notifikasiTerkirim: false },
    select: { judul: true },
  });
  if (!p) return;
  // Penanda dipasang lebih dulu dan atomik: dua pemanggil bersamaan, hanya satu yang lanjut.
  const r = await db().pengumuman.updateMany({ where: { id, notifikasiTerkirim: false }, data: { notifikasiTerkirim: true } });
  if (r.count !== 1) return;
  await beriNotifikasiAman({
    userIds: await userIdSemua(),
    jenis: "pengumuman",
    judul: "Pengumuman baru",
    isi: p.judul,
    tautan: `/admin/pengumuman/${id}`,
    kunci: `umum:${id}`,
  });
}
