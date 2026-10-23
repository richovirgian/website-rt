import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { peranDari, punya, type Izin, type Peran } from "@/lib/izin";

export type Role = Peran;

/**
 * Sesi yang sedang berjalan, atau null.
 *
 * Diperiksa di server pada setiap permintaan, bukan lewat middleware. Alasannya
 * bukan gaya: CVE-2025-29927 menunjukkan proteksi yang hanya bersandar pada
 * middleware Next.js bisa dilewati lewat header yang dibuat sendiri. Penjaga
 * yang mengambil keputusan harus berada di tempat datanya dibaca.
 */
export async function sesi() {
  return auth().api.getSession({ headers: await headers() });
}

export type SesiPengguna = NonNullable<Awaited<ReturnType<typeof sesi>>>;

export function peranPengguna(s: SesiPengguna): Peran {
  return peranDari((s.user as { role?: string | null }).role);
}

/** Sesi wajib. Mengalihkan ke halaman masuk bila tidak ada. */
export async function wajibMasuk(): Promise<SesiPengguna> {
  const s = await sesi();
  if (!s) redirect("/masuk");
  return s;
}

/**
 * Penjaga halaman server component: harus masuk DAN punya izin. Tanpa izin,
 * dialihkan ke ringkasan, bukan ke halaman galat yang membocorkan bahwa
 * halamannya ada.
 */
export async function wajibIzin(
  izin: Izin,
): Promise<SesiPengguna & { peran: Peran }> {
  const s = await wajibMasuk();
  const peran = peranPengguna(s);
  if (!punya(peran, izin)) redirect("/admin");
  return { ...s, peran };
}

/**
 * Penjaga untuk server action dan route handler. Mengembalikan objek status
 * yang bisa langsung di-return, tanpa redirect.
 *
 * WAJIB dipanggil di awal setiap aksi yang membaca atau mengubah data. Layout
 * panel bukan penjaga: aksi server bisa dipanggil langsung tanpa layout itu
 * pernah dirender.
 */
export async function periksaIzinAksi(izin: Izin): Promise<
  | { ok: true; sesi: SesiPengguna; peran: Peran }
  | { ok: false; pesan: string }
> {
  const s = await sesi();
  if (!s) {
    return { ok: false, pesan: "Sesi telah berakhir. Silakan masuk kembali." };
  }
  const peran = peranPengguna(s);
  if (!punya(peran, izin)) {
    return { ok: false, pesan: "Akses ditolak. Anda tidak berwenang melakukan tindakan ini." };
  }
  return { ok: true, sesi: s, peran };
}
