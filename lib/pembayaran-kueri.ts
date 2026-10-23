import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import { hariIni, tanggalUtc } from "@/lib/uang";

/**
 * Kueri baca pembayaran, kuitansi, dan kas. Pemanggil WAJIB sudah memeriksa
 * izin; untuk data milik warga, gunakan `rumahIdMilik` agar pembatasan
 * ditentukan dari akun yang masuk, bukan dari input.
 */

export const PER_HALAMAN_PEMBAYARAN = 20;

/** Rumah yang sedang ditempati keluarga milik akun ini, atau null. */
export async function rumahIdMilik(userId: string): Promise<string | null> {
  const w = await db().warga.findUnique({
    where: { userId },
    select: { keluarga: { select: { tanggalKeluar: true, rumahId: true } } },
  });
  return w && !w.keluarga.tanggalKeluar ? w.keluarga.rumahId : null;
}

const pilihPembayaran = {
  id: true,
  metode: true,
  status: true,
  nominal: true,
  tanggalBayar: true,
  dibayarOleh: true,
  catatan: true,
  alasanTolak: true,
  diverifikasiOleh: true,
  dibatalkanAlasan: true,
  dibuatPada: true,
  bukti: { select: { id: true, tipe: true, namaBerkas: true } },
  kuitansi: { select: { id: true, nomor: true } },
  tagihan: {
    select: { id: true, judul: true, rumah: { select: { id: true, blok: true, nomor: true } } },
  },
} satisfies Prisma.PembayaranSelect;

export const antreanPembayaran = () =>
  db().pembayaran.findMany({
    where: { status: "PENDING" },
    orderBy: { dibuatPada: "asc" },
    select: pilihPembayaran,
  });

export const jumlahMenunggu = () => db().pembayaran.count({ where: { status: "PENDING" } });

export async function riwayatPembayaran({ status, halaman }: { status?: string; halaman: number }) {
  const where: Prisma.PembayaranWhereInput =
    status === "PENDING" || status === "VERIFIED" || status === "REJECTED" || status === "VOIDED"
      ? { status }
      : {};
  const [baris, total] = await Promise.all([
    db().pembayaran.findMany({
      where,
      orderBy: { dibuatPada: "desc" },
      skip: (halaman - 1) * PER_HALAMAN_PEMBAYARAN,
      take: PER_HALAMAN_PEMBAYARAN,
      select: pilihPembayaran,
    }),
    db().pembayaran.count({ where }),
  ]);
  return { baris, total };
}

/** Kuitansi beserta rumah pemiliknya, untuk pemeriksaan akses dan cetak. */
export const detailKuitansi = (id: string) =>
  db().kuitansi.findUnique({
    where: { id },
    select: {
      id: true,
      nomor: true,
      diterbitkanPada: true,
      pembayaran: {
        select: {
          metode: true,
          status: true,
          nominal: true,
          tanggalBayar: true,
          dibayarOleh: true,
          diverifikasiOleh: true,
          dibatalkanAlasan: true,
          tagihan: { select: { judul: true, rumahId: true, rumah: { select: { blok: true, nomor: true } } } },
        },
      },
    },
  });

/** Bentuk satu hari awal bulan: "2026-11" menjadi [2026-11-01, 2026-12-01). */
function rentangBulan(bulan: string): { gte: Date; lt: Date } {
  const [t, b] = bulan.split("-").map(Number) as [number, number];
  const lt = b === 12 ? `${t + 1}-01-01` : `${t}-${String(b + 1).padStart(2, "0")}-01`;
  return { gte: tanggalUtc(`${bulan}-01`), lt: tanggalUtc(lt) };
}

const POLA_BULAN = /^\d{4}-(0[1-9]|1[0-2])$/;
export const bulanSah = (b: string | undefined): b is string => !!b && POLA_BULAN.test(b);

export async function ringkasanKas() {
  const bulanIni = hariIni().slice(0, 7);
  const r = rentangBulan(bulanIni);
  const jumlah = (where: Prisma.TransaksiKasWhereInput) =>
    db().transaksiKas.aggregate({ where, _sum: { nominal: true } }).then((x) => x._sum.nominal?.toNumber() ?? 0);

  const [masuk, keluar, masukBulan, keluarBulan] = await Promise.all([
    jumlah({ jenis: "MASUK" }),
    jumlah({ jenis: "KELUAR" }),
    jumlah({ jenis: "MASUK", tanggal: r }),
    jumlah({ jenis: "KELUAR", tanggal: r }),
  ]);
  return { saldo: masuk - keluar, masuk, keluar, masukBulan, keluarBulan, bulanIni };
}

/** Rekap per bulan untuk 12 bulan terakhir (yang punya transaksi), terbaru dulu. */
export async function rekapBulanan() {
  const baris = await db().$queryRaw<{ bulan: string; jenis: string; total: number }[]>`
    SELECT to_char(tanggal, 'YYYY-MM') AS bulan, jenis::text AS jenis, SUM(nominal)::float8 AS total
    FROM transaksi_kas
    GROUP BY 1, 2
    ORDER BY 1 DESC
    LIMIT 24`;
  const peta = new Map<string, { bulan: string; masuk: number; keluar: number }>();
  for (const b of baris) {
    const e = peta.get(b.bulan) ?? { bulan: b.bulan, masuk: 0, keluar: 0 };
    if (b.jenis === "MASUK") e.masuk = b.total;
    else e.keluar = b.total;
    peta.set(b.bulan, e);
  }
  return [...peta.values()].sort((a, b) => b.bulan.localeCompare(a.bulan)).slice(0, 12);
}

export async function rekapKategori(bulan?: string) {
  const rentang = bulan ? rentangBulan(bulan) : null;
  const baris = await db().$queryRaw<{ nama: string; jenis: string; total: number }[]>`
    SELECT k.nama AS nama, t.jenis::text AS jenis, SUM(t.nominal)::float8 AS total
    FROM transaksi_kas t JOIN kategori_kas k ON k.id = t.kategori_id
    WHERE (${rentang?.gte ?? null}::date IS NULL OR t.tanggal >= ${rentang?.gte ?? null}::date)
      AND (${rentang?.lt ?? null}::date IS NULL OR t.tanggal < ${rentang?.lt ?? null}::date)
    GROUP BY 1, 2
    ORDER BY 3 DESC`;
  return baris;
}

export async function daftarKas({ bulan, jenis, halaman }: { bulan?: string; jenis?: string; halaman: number }) {
  const where: Prisma.TransaksiKasWhereInput = {
    ...(bulanSah(bulan) ? { tanggal: rentangBulan(bulan) } : {}),
    ...(jenis === "MASUK" || jenis === "KELUAR" ? { jenis } : {}),
  };
  const [baris, total] = await Promise.all([
    db().transaksiKas.findMany({
      where,
      orderBy: [{ tanggal: "desc" }, { nomor: "desc" }],
      skip: (halaman - 1) * PER_HALAMAN_PEMBAYARAN,
      take: PER_HALAMAN_PEMBAYARAN,
      select: {
        id: true,
        nomor: true,
        jenis: true,
        nominal: true,
        tanggal: true,
        deskripsi: true,
        dicatatOleh: true,
        pembayaranId: true,
        koreksiDariId: true,
        koreksi: { select: { nomor: true } },
        kategori: { select: { nama: true } },
      },
    }),
    db().transaksiKas.count({ where }),
  ]);
  return { baris, total };
}

export const kategoriKasAktif = () =>
  db().kategoriKas.findMany({ where: { aktif: true }, orderBy: [{ jenis: "asc" }, { nama: "asc" }], select: { id: true, nama: true, jenis: true } });

export async function kasUntukEkspor(bulan?: string) {
  return db().transaksiKas.findMany({
    where: bulanSah(bulan) ? { tanggal: rentangBulan(bulan) } : {},
    orderBy: [{ tanggal: "asc" }, { nomor: "asc" }],
    select: { nomor: true, tanggal: true, jenis: true, nominal: true, deskripsi: true, dicatatOleh: true, kategori: { select: { nama: true } } },
  });
}

/** Tagihan yang boleh dibayar akun ini, dengan pembayaran terakhirnya. */
export async function tagihanUntukBayar(userId: string, tagihanId: string) {
  const rumahId = await rumahIdMilik(userId);
  if (!rumahId) return null;
  return db().tagihan.findFirst({
    where: { id: tagihanId, rumahId },
    select: {
      id: true,
      judul: true,
      nominal: true,
      jatuhTempo: true,
      status: true,
      rumah: { select: { blok: true, nomor: true } },
      pembayaran: {
        orderBy: { dibuatPada: "desc" },
        take: 1,
        select: { id: true, status: true, alasanTolak: true, tanggalBayar: true },
      },
    },
  });
}
