import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { peranPengguna, sesi } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";

/**
 * Melayani berkas lampiran. TIDAK pernah publik, dan izinnya mengikuti
 * induknya:
 *  - lampiran surat: Admin (`letters.read`) atau pemohonnya;
 *  - lampiran pengaduan: Admin (`complaints.read`) atau pelapornya;
 *  - lampiran pengumuman: siapa pun yang masuk, bila pengumumannya sudah
 *    terlihat; Admin (`announcements.manage`) juga untuk draf.
 * Yang tidak berhak dijawab 404, bukan 403, supaya keberadaannya tidak bocor.
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tidakAda = () => new NextResponse("Tidak ditemukan.", { status: 404 });

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return tidakAda();

  const s = await sesi();
  if (!s) return new NextResponse("Silakan masuk.", { status: 401 });
  const peran = peranPengguna(s);

  const l = await db().lampiran.findUnique({
    where: { id },
    select: {
      tipe: true,
      namaBerkas: true,
      data: true,
      pengajuanSurat: { select: { pemohonUserId: true } },
      pengaduan: { select: { pelaporUserId: true } },
      pengumuman: { select: { status: true, terbitPada: true } },
    },
  });
  if (!l) return tidakAda();

  let boleh = false;
  if (l.pengajuanSurat) boleh = punya(peran, "letters.read") || l.pengajuanSurat.pemohonUserId === s.user.id;
  else if (l.pengaduan) boleh = punya(peran, "complaints.read") || l.pengaduan.pelaporUserId === s.user.id;
  else if (l.pengumuman) {
    const terlihat = l.pengumuman.status === "TERBIT" && !!l.pengumuman.terbitPada && l.pengumuman.terbitPada <= new Date();
    boleh = terlihat || punya(peran, "announcements.manage");
  }
  if (!boleh) return tidakAda();

  return new NextResponse(Buffer.from(l.data), {
    headers: {
      "content-type": l.tipe,
      "content-disposition": `inline; filename="${l.namaBerkas.replace(/"/g, "")}"`,
      "x-content-type-options": "nosniff",
      "content-security-policy": "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox",
      "cache-control": "private, no-store",
    },
  });
}
