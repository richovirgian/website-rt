import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Kueri baca data rumah, keluarga, dan warga.
 *
 * Pemanggil WAJIB sudah memeriksa izin (`wajibIzin`). Parameter `identitas`
 * menentukan apakah kolom identitas (akhir NIK) ikut diambil: peran tanpa
 * `residents.read_identity` tidak pernah menerimanya dari database.
 */

export const PER_HALAMAN = 20;

export const nomorHalaman = (nilai: string | undefined) =>
  Math.max(1, Number.parseInt(nilai ?? "1", 10) || 1);

const pilihAnggota = (identitas: boolean) =>
  ({
    id: true,
    namaLengkap: true,
    hubungan: true,
    statusDomisili: true,
    jenisKelamin: true,
    tanggalLahir: true,
    userId: true,
    ...(identitas ? { nikAkhir4: true } : {}),
  }) satisfies Prisma.WargaSelect;

export async function daftarRumah({ q, halaman }: { q?: string; halaman: number }) {
  const where: Prisma.RumahWhereInput = q
    ? {
        OR: [
          { nomor: { contains: q, mode: "insensitive" } },
          { blok: { contains: q, mode: "insensitive" } },
          { alamat: { contains: q, mode: "insensitive" } },
          { keluarga: { some: { anggota: { some: { namaLengkap: { contains: q, mode: "insensitive" } } } } } },
        ],
      }
    : {};

  const [baris, total] = await Promise.all([
    db().rumah.findMany({
      where,
      orderBy: [{ blok: "asc" }, { nomor: "asc" }],
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      include: {
        keluarga: {
          where: { tanggalKeluar: null },
          select: {
            id: true,
            statusHunian: true,
            anggota: {
              where: { statusDomisili: "AKTIF" },
              select: { id: true, namaLengkap: true, hubungan: true },
            },
          },
        },
      },
    }),
    db().rumah.count({ where }),
  ]);
  return { baris, total };
}

export const semuaRumahRingkas = () =>
  db().rumah.findMany({
    orderBy: [{ blok: "asc" }, { nomor: "asc" }],
    select: { id: true, blok: true, nomor: true },
  });

export function detailRumah(id: string, identitas: boolean) {
  return db().rumah.findUnique({
    where: { id },
    include: {
      keluarga: {
        orderBy: [{ tanggalKeluar: { sort: "asc", nulls: "first" } }, { tanggalMasuk: "desc" }],
        include: {
          anggota: { orderBy: { namaLengkap: "asc" }, select: pilihAnggota(identitas) },
        },
      },
    },
  });
}

export async function daftarWarga({
  q,
  status,
  halaman,
}: {
  q?: string;
  status?: string;
  halaman: number;
}) {
  const where: Prisma.WargaWhereInput = {
    ...(q ? { namaLengkap: { contains: q, mode: "insensitive" } } : {}),
    ...(status === "AKTIF" || status === "PINDAH" || status === "MENINGGAL"
      ? { statusDomisili: status }
      : {}),
  };
  const [baris, total] = await Promise.all([
    db().warga.findMany({
      where,
      orderBy: { namaLengkap: "asc" },
      skip: (halaman - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
      select: {
        id: true,
        namaLengkap: true,
        hubungan: true,
        statusDomisili: true,
        noHp: true,
        userId: true,
        keluarga: { select: { rumah: { select: { id: true, blok: true, nomor: true } } } },
      },
    }),
    db().warga.count({ where }),
  ]);
  return { baris, total };
}

export function detailWarga(id: string, identitas: boolean) {
  return db().warga.findUnique({
    where: { id },
    select: {
      id: true,
      keluargaId: true,
      namaLengkap: true,
      jenisKelamin: true,
      tempatLahir: true,
      tanggalLahir: true,
      hubungan: true,
      statusDomisili: true,
      noHp: true,
      pekerjaan: true,
      userId: true,
      ...(identitas ? { nikAkhir4: true } : {}),
      user: { select: { email: true } },
      keluarga: { select: { id: true, statusHunian: true, rumah: { select: { id: true, blok: true, nomor: true } } } },
    },
  });
}

export async function ringkasanWarga() {
  const [rumah, keluarga, warga, akun] = await Promise.all([
    db().rumah.count(),
    db().keluarga.count({ where: { tanggalKeluar: null } }),
    db().warga.count({ where: { statusDomisili: "AKTIF" } }),
    db().warga.count({ where: { statusDomisili: "AKTIF", userId: { not: null } } }),
  ]);
  return { rumah, keluarga, warga, akun };
}

/** Rumah tangga milik akun ini, atau null bila akun belum ditautkan ke warga. */
export function profilWargaSendiri(userId: string) {
  return db().warga.findUnique({
    where: { userId },
    select: {
      id: true,
      namaLengkap: true,
      hubungan: true,
      noHp: true,
      pekerjaan: true,
      keluarga: {
        select: {
          statusHunian: true,
          tanggalMasuk: true,
          rumah: { select: { blok: true, nomor: true, alamat: true } },
          anggota: {
            where: { statusDomisili: "AKTIF" },
            orderBy: { namaLengkap: "asc" },
            select: { id: true, namaLengkap: true, hubungan: true },
          },
        },
      },
    },
  });
}

/** Seluruh warga untuk ekspor CSV. Tanpa NIK. */
export const wargaUntukEkspor = () =>
  db().warga.findMany({
    orderBy: [{ keluarga: { rumah: { blok: "asc" } } }, { keluarga: { rumah: { nomor: "asc" } } }, { namaLengkap: "asc" }],
    select: {
      namaLengkap: true,
      jenisKelamin: true,
      tempatLahir: true,
      tanggalLahir: true,
      hubungan: true,
      statusDomisili: true,
      noHp: true,
      pekerjaan: true,
      keluarga: { select: { statusHunian: true, rumah: { select: { blok: true, nomor: true } } } },
    },
  });
