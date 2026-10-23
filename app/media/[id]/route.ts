import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Melayani gambar situs (galeri dan sampul artikel). PUBLIK, karena memang
 * tampil di situs publik. Hanya tabel `gambar_situs`: lampiran surat,
 * pengaduan, dan bukti transfer ada di tabel lain dan tidak pernah lewat
 * sini. Isi gambar tidak pernah berubah untuk satu ID, jadi boleh di-cache
 * lama.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Tidak ditemukan.", { status: 404 });
  const g = await db().gambarSitus.findUnique({ where: { id }, select: { tipe: true, data: true } });
  if (!g) return new NextResponse("Tidak ditemukan.", { status: 404 });
  return new NextResponse(Buffer.from(g.data), {
    headers: {
      "content-type": g.tipe,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
