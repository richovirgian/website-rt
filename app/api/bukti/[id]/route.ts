import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { peranPengguna, sesi } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { rumahIdMilik } from "@/lib/pembayaran-kueri";

/**
 * Melayani berkas bukti transfer. TIDAK pernah publik: bendahara dan admin
 * (`payments.read`) boleh membuka semua, warga hanya bukti untuk tagihan
 * rumahnya sendiri. Tipe berkas diambil dari yang sudah divalidasi saat
 * unggah (dari isi berkas), dan `nosniff` mencegah peramban menebak ulang.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Tidak ditemukan.", { status: 404 });

  const s = await sesi();
  if (!s) return new NextResponse("Silakan masuk.", { status: 401 });
  const peran = peranPengguna(s);

  const b = await db().buktiPembayaran.findUnique({
    where: { id },
    select: {
      tipe: true,
      namaBerkas: true,
      data: true,
      pembayaran: { select: { tagihan: { select: { rumahId: true } } } },
    },
  });
  if (!b) return new NextResponse("Tidak ditemukan.", { status: 404 });

  let boleh = punya(peran, "payments.read");
  if (!boleh && punya(peran, "payments.read.own")) {
    boleh = (await rumahIdMilik(s.user.id)) === b.pembayaran.tagihan.rumahId;
  }
  // 404, bukan 403: tidak membocorkan bahwa berkas itu ada.
  if (!boleh) return new NextResponse("Tidak ditemukan.", { status: 404 });

  return new NextResponse(Buffer.from(b.data), {
    headers: {
      "content-type": b.tipe,
      "content-disposition": `inline; filename="${b.namaBerkas.replace(/"/g, "")}"`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "cache-control": "private, no-store",
    },
  });
}
