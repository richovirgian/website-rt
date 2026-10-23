import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import { hariIni, tanggalUtc } from "@/lib/uang";

/**
 * Kueri baca iuran dan tagihan. Pemanggil WAJIB sudah memeriksa izin.
 * "Terlambat" dihitung di sini dari jatuh tempo dan tanggal Jakarta hari ini.
 */

export const PER_HALAMAN_TAGIHAN = 25;

export const daftarJenisIuran = () =>
  db().jenisIuran.findMany({
    orderBy: [{ aktif: "desc" }, { nama: "asc" }],
    include: {
      aturan: { orderBy: { berlakuMulai: "desc" } },
      _count: { select: { tagihan: true } },
    },
  });

export const jenisIuranAktif = () =>
  db().jenisIuran.findMany({
    where: { aktif: true },
    orderBy: { nama: "asc" },
    select: { id: true, nama: true, frekuensi: true, hariJatuhTempo: true },
  });

export type SaringanTagihan = {
  q?: string;
  status?: string;
  periode?: string;
  jenisId?: string;
  halaman: number;
};

function whereTagihan(s: Omit<SaringanTagihan, "halaman">): Prisma.TagihanWhereInput {
  const hari = tanggalUtc(hariIni());
  return {
    ...(s.status === "UNPAID" || s.status === "PAID" || s.status === "CANCELLED"
      ? { status: s.status }
      : {}),
    ...(s.status === "TERLAMBAT" ? { status: "UNPAID", jatuhTempo: { lt: hari } } : {}),
    ...(s.periode ? { periode: s.periode } : {}),
    ...(s.jenisId ? { jenisIuranId: s.jenisId } : {}),
    ...(s.q
      ? {
          OR: [
            { rumah: { nomor: { contains: s.q, mode: "insensitive" } } },
            { rumah: { blok: { contains: s.q, mode: "insensitive" } } },
            { judul: { contains: s.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function daftarTagihan(s: SaringanTagihan) {
  const where = whereTagihan(s);
  const [baris, total] = await Promise.all([
    db().tagihan.findMany({
      where,
      orderBy: [{ jatuhTempo: "desc" }, { dibuatPada: "desc" }],
      skip: (s.halaman - 1) * PER_HALAMAN_TAGIHAN,
      take: PER_HALAMAN_TAGIHAN,
      select: {
        id: true,
        judul: true,
        periode: true,
        nominal: true,
        jatuhTempo: true,
        status: true,
        dibatalkanAlasan: true,
        rumah: { select: { id: true, blok: true, nomor: true } },
        pembayaran: { where: { status: "VERIFIED" }, take: 1, select: { kuitansi: { select: { id: true } } } },
      },
    }),
    db().tagihan.count({ where }),
  ]);
  return { baris, total };
}

export async function periodeTersedia(): Promise<string[]> {
  const r = await db().tagihan.findMany({
    distinct: ["periode"],
    select: { periode: true },
    orderBy: { periode: "desc" },
    take: 36,
  });
  return r.map((x) => x.periode);
}

export async function ringkasanTagihan() {
  const hari = tanggalUtc(hariIni());
  const [belum, terlambat, lunas] = await Promise.all([
    db().tagihan.aggregate({ where: { status: "UNPAID" }, _count: { _all: true }, _sum: { nominal: true } }),
    db().tagihan.aggregate({ where: { status: "UNPAID", jatuhTempo: { lt: hari } }, _count: { _all: true }, _sum: { nominal: true } }),
    db().tagihan.aggregate({ where: { status: "PAID" }, _count: { _all: true }, _sum: { nominal: true } }),
  ]);
  return {
    belumLunas: { jumlah: belum._count._all, total: belum._sum.nominal?.toNumber() ?? 0 },
    terlambat: { jumlah: terlambat._count._all, total: terlambat._sum.nominal?.toNumber() ?? 0 },
    lunas: { jumlah: lunas._count._all, total: lunas._sum.nominal?.toNumber() ?? 0 },
  };
}

/** Rekap tunggakan: tagihan belum dibayar dijumlahkan per rumah. */
export async function tunggakanPerRumah() {
  const hari = tanggalUtc(hariIni());
  const kelompok = await db().tagihan.groupBy({
    by: ["rumahId"],
    where: { status: "UNPAID" },
    _count: { _all: true },
    _sum: { nominal: true },
    _min: { jatuhTempo: true },
  });
  if (kelompok.length === 0) return [];

  const rumah = await db().rumah.findMany({
    where: { id: { in: kelompok.map((k) => k.rumahId) } },
    select: { id: true, blok: true, nomor: true },
  });
  const peta = new Map(rumah.map((r) => [r.id, r]));

  return kelompok
    .map((k) => ({
      rumah: peta.get(k.rumahId)!,
      jumlah: k._count._all,
      total: k._sum.nominal?.toNumber() ?? 0,
      terlambat: k._min.jatuhTempo ? k._min.jatuhTempo < hari : false,
      tertua: k._min.jatuhTempo,
    }))
    .filter((k) => k.rumah)
    .sort((a, b) => b.total - a.total);
}

/**
 * Tagihan rumah milik akun ini. Datanya dicari dari ID akun: akun -> warga ->
 * keluarga -> rumah. Tidak ada parameter rumah dari luar, jadi warga tidak
 * bisa melihat tagihan rumah lain. Keluarga yang sudah pindah tidak
 * mewarisi tagihan rumah itu. Tagihan yang dibatalkan tidak ditampilkan.
 */
export async function tagihanRumahSaya(userId: string) {
  const w = await db().warga.findUnique({
    where: { userId },
    select: {
      keluarga: {
        select: { tanggalKeluar: true, rumah: { select: { id: true, blok: true, nomor: true } } },
      },
    },
  });
  if (!w || w.keluarga.tanggalKeluar) return null;

  const tagihan = await db().tagihan.findMany({
    where: { rumahId: w.keluarga.rumah.id, status: { in: ["UNPAID", "PAID"] } },
    orderBy: [{ status: "asc" }, { jatuhTempo: "desc" }],
    take: 100,
    select: {
      id: true,
      judul: true,
      nominal: true,
      jatuhTempo: true,
      status: true,
      // Pembayaran terakhir yang masih relevan: menunggu, ditolak, atau sah.
      pembayaran: {
        where: { status: { in: ["PENDING", "REJECTED", "VERIFIED"] } },
        orderBy: { dibuatPada: "desc" },
        take: 1,
        select: { status: true, alasanTolak: true, kuitansi: { select: { id: true } } },
      },
    },
  });
  return { rumah: w.keluarga.rumah, tagihan };
}
