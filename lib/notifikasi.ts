import type { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";

/**
 * Notifikasi dalam aplikasi.
 *
 * Unik pada (pengguna, kunci): peristiwa yang sama tidak pernah memberi dua
 * notifikasi ke orang yang sama, walau aksi atau penjadwal dijalankan
 * berulang. Kunci memuat jenis peristiwa dan ID-nya, contoh `tagihan-baru:<id>`.
 *
 * Notifikasi adalah pelengkap, bukan inti: kegagalan menulisnya tidak boleh
 * membatalkan tindakan yang sudah berhasil, tetapi dicatat ke log server
 * supaya lubangnya terlihat. Gunakan `beriNotifikasiAman` dari aksi.
 *
 * Email dan WhatsApp BELUM diimplementasikan. Lihat `statusKanal` di bawah:
 * halaman admin menyatakannya apa adanya, dan tidak ada notifikasi yang
 * ditandai "terkirim" lewat kanal luar.
 */

type Klien = Pick<Prisma.TransactionClient, "notifikasi">;

export type IsiNotifikasi = {
  userIds: string[];
  jenis: string;
  judul: string;
  isi: string;
  tautan?: string;
  /** Kunci unik peristiwa, atau fungsi yang memberi kunci per pengguna. */
  kunci: string | ((userId: string) => string);
};

export async function beriNotifikasi(klien: Klien, n: IsiNotifikasi): Promise<number> {
  const unik = [...new Set(n.userIds)];
  if (unik.length === 0) return 0;
  const r = await klien.notifikasi.createMany({
    data: unik.map((userId) => ({
      userId,
      jenis: n.jenis,
      judul: n.judul,
      isi: n.isi,
      tautan: n.tautan ?? null,
      kunci: typeof n.kunci === "string" ? n.kunci : n.kunci(userId),
    })),
    skipDuplicates: true,
  });
  return r.count;
}

export async function beriNotifikasiAman(n: IsiNotifikasi): Promise<void> {
  try {
    await beriNotifikasi(db(), n);
  } catch (e) {
    console.error("[notifikasi] gagal menulis:", n.jenis, e);
  }
}

/** Akun Admin yang tidak diblokir. */
export async function userIdAdmin(): Promise<string[]> {
  const u = await db().user.findMany({
    where: { role: "admin", banned: { not: true } },
    select: { id: true },
  });
  return u.map((x) => x.id);
}

/** Semua akun yang tidak diblokir. */
export async function userIdSemua(): Promise<string[]> {
  const u = await db().user.findMany({ where: { banned: { not: true } }, select: { id: true } });
  return u.map((x) => x.id);
}

/** Akun warga yang tinggal aktif di rumah-rumah itu, dikelompokkan per rumah. */
export async function userIdPerRumah(rumahIds: string[]): Promise<Map<string, string[]>> {
  const w = await db().warga.findMany({
    where: {
      statusDomisili: "AKTIF",
      userId: { not: null },
      keluarga: { tanggalKeluar: null, rumahId: { in: rumahIds } },
    },
    select: { userId: true, keluarga: { select: { rumahId: true } } },
  });
  const peta = new Map<string, string[]>();
  for (const x of w) {
    const l = peta.get(x.keluarga.rumahId) ?? [];
    l.push(x.userId!);
    peta.set(x.keluarga.rumahId, l);
  }
  return peta;
}

/**
 * Status kanal luar. Dihitung dari env: kanal dianggap siap hanya bila
 * kredensialnya ada. Saat ini penyalurannya belum dibangun, jadi walau env
 * terisi, statusnya tetap "belum dibangun" supaya tidak menyesatkan.
 */
export function statusKanal(): { nama: string; status: string }[] {
  return [
    { nama: "Dalam aplikasi", status: "Aktif" },
    { nama: "Email", status: process.env.SMTP_HOST ? "Kredensial ada, penyaluran belum dibangun" : "Belum dikonfigurasi" },
    { nama: "WhatsApp", status: process.env.WHATSAPP_API_TOKEN ? "Kredensial ada, penyaluran belum dibangun" : "Belum dikonfigurasi" },
  ];
}
