import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { catatAudit } from "@/lib/audit";
import { terbitkanOtomatis } from "@/lib/tagihan";
import { pengingatKegiatan, pengingatTagihan, umumkanTerjadwal } from "@/lib/pengingat";

/**
 * Penjadwal harian (lihat vercel.json): menerbitkan tagihan bulanan otomatis,
 * mengirim pengingat jatuh tempo, mengumumkan pengumuman terjadwal, dan
 * mengingatkan kegiatan. Vercel Cron otomatis mengirim
 * `Authorization: Bearer <CRON_SECRET>`.
 *
 * Tanpa CRON_SECRET, endpoint ini MENOLAK semua permintaan. Setiap langkah
 * berdiri sendiri: kegagalan satu langkah tidak menghentikan yang lain.
 * Semuanya aman dijalankan berulang kali.
 */
export const dynamic = "force-dynamic";

const sama = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

async function langkah<T>(nama: string, f: () => Promise<T>): Promise<{ nama: string; ok: boolean; hasil?: T; pesan?: string }> {
  try {
    return { nama, ok: true, hasil: await f() };
  } catch (e) {
    console.error(`[cron] ${nama} gagal:`, e);
    return { nama, ok: false, pesan: "Gagal. Lihat log server." };
  }
}

export async function GET(req: Request) {
  const rahasia = process.env.CRON_SECRET;
  if (!rahasia) return NextResponse.json({ pesan: "CRON_SECRET belum dikonfigurasi." }, { status: 503 });
  if (!sama(req.headers.get("authorization") ?? "", `Bearer ${rahasia}`)) {
    return NextResponse.json({ pesan: "Tidak berwenang." }, { status: 401 });
  }

  // Setiap langkah berdiri sendiri dan dipertahankan bertipe sendiri.
  const tagihan = await langkah("tagihan-otomatis", terbitkanOtomatis);
  const pengingat = await langkah("pengingat-tagihan", () => pengingatTagihan());
  const pengumuman = await langkah("pengumuman-terjadwal", umumkanTerjadwal);
  const kegiatan = await langkah("pengingat-kegiatan", () => pengingatKegiatan());
  const hasil = [tagihan, pengingat, pengumuman, kegiatan];

  await catatAudit({
    aktorId: null,
    aktorNama: "Sistem",
    aksi: "cron.harian",
    entitas: "sistem",
    metadata: {
      gagal: hasil.filter((h) => !h.ok).length,
      tagihanDibuat: tagihan.hasil?.reduce((n, h) => n + (h.dibuat ?? 0), 0) ?? 0,
      pengingatTagihan: pengingat.hasil ? pengingat.hasil.tiga + pengingat.hasil.lewat : 0,
      pengumumanDiumumkan: pengumuman.hasil ?? 0,
      pengingatKegiatan: kegiatan.hasil ?? 0,
    },
  });
  return NextResponse.json({ ok: hasil.every((h) => h.ok), hasil });
}
