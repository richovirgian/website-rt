import { db } from "@/lib/db";
import { beriNotifikasi, userIdPerRumah, userIdSemua } from "@/lib/notifikasi";
import { umumkan } from "@/lib/umumkan";
import { formatRupiah, hariIni, tanggalUtc } from "@/lib/uang";
import { formatWaktu } from "@/lib/komunikasi-label";

/**
 * Pekerjaan harian penjadwal selain penerbitan tagihan: pengingat jatuh
 * tempo, pengumuman terjadwal, dan pengingat kegiatan. Semuanya IDEMPOTEN
 * lewat kunci notifikasi yang unik per pengguna, jadi aman dijalankan
 * berulang kali dan aman bila penjadwal terlambat atau berjalan dua kali.
 */

const tambahHari = (iso: string, n: number) => {
  const d = tanggalUtc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** Pengingat tiga hari sebelum jatuh tempo, dan sekali saat lewat jatuh tempo. */
export async function pengingatTagihan(sekarang: Date = new Date()): Promise<{ tiga: number; lewat: number }> {
  const hari = hariIni(sekarang);
  const [segera, lewat] = await Promise.all([
    db().tagihan.findMany({
      where: { status: "UNPAID", jatuhTempo: tanggalUtc(tambahHari(hari, 3).toISOString().slice(0, 10)) },
      select: { id: true, rumahId: true, judul: true, nominal: true },
    }),
    // Hanya yang baru lewat (7 hari terakhir), supaya penjadwal yang baru dinyalakan tidak membanjiri warga dengan tunggakan lama.
    db().tagihan.findMany({
      where: { status: "UNPAID", jatuhTempo: { lt: tanggalUtc(hari), gte: tambahHari(hari, -7) } },
      select: { id: true, rumahId: true, judul: true, nominal: true },
    }),
  ]);
  const peta = await userIdPerRumah([...new Set([...segera, ...lewat].map((t) => t.rumahId))]);

  let tiga = 0;
  let terlambat = 0;
  for (const t of segera) {
    tiga += await beriNotifikasi(db(), {
      userIds: peta.get(t.rumahId) ?? [],
      jenis: "tagihan-segera",
      judul: "Tagihan jatuh tempo 3 hari lagi",
      isi: `${t.judul}: ${formatRupiah(t.nominal)}.`,
      tautan: "/admin/tagihan-saya",
      kunci: `tempo3:${t.id}`,
    });
  }
  for (const t of lewat) {
    terlambat += await beriNotifikasi(db(), {
      userIds: peta.get(t.rumahId) ?? [],
      jenis: "tagihan-lewat",
      judul: "Tagihan melewati jatuh tempo",
      isi: `${t.judul}: ${formatRupiah(t.nominal)} belum dibayar.`,
      tautan: "/admin/tagihan-saya",
      kunci: `lewat:${t.id}`,
    });
  }
  return { tiga, lewat: terlambat };
}

/** Pengumuman terjadwal yang waktunya sudah tiba. Mengembalikan jumlah yang diumumkan. */
export async function umumkanTerjadwal(sekarang: Date = new Date()): Promise<number> {
  const due = await db().pengumuman.findMany({
    where: { status: "TERBIT", terbitPada: { lte: sekarang }, notifikasiTerkirim: false },
    select: { id: true },
  });
  for (const p of due) await umumkan(p.id);
  return due.length;
}

/** Pengingat kegiatan yang mulai dalam 30 jam ke depan, kecuali bagi yang sudah menyatakan tidak ikut. */
export async function pengingatKegiatan(sekarang: Date = new Date()): Promise<number> {
  const batas = new Date(sekarang.getTime() + 30 * 3600_000);
  const daftar = await db().kegiatan.findMany({
    where: { status: "DIJADWALKAN", mulai: { gt: sekarang, lte: batas } },
    select: { id: true, judul: true, mulai: true, lokasi: true, peserta: { where: { hadir: false }, select: { userId: true } } },
  });
  const semua = daftar.length ? await userIdSemua() : [];
  let n = 0;
  for (const k of daftar) {
    const tolak = new Set(k.peserta.map((x) => x.userId));
    n += await beriNotifikasi(db(), {
      userIds: semua.filter((u) => !tolak.has(u)),
      jenis: "kegiatan-besok",
      judul: "Pengingat kegiatan",
      isi: `${k.judul}, ${formatWaktu(k.mulai)} di ${k.lokasi}.`,
      tautan: `/admin/kegiatan/${k.id}`,
      kunci: `kegiatan1:${k.id}`,
    });
  }
  return n;
}
