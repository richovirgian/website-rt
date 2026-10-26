import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";
import { hariIni, tanggalUtc } from "@/lib/uang";

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

/** Tab status di halaman Warga: Tetap = aktif berstatus pemilik, Kontrak = aktif berstatus penyewa. */
export const TAB_WARGA = ["SEMUA", "TETAP", "KONTRAK", "PINDAH"] as const;
export type TabWarga = (typeof TAB_WARGA)[number];

const filterTab = (status: string | undefined): Prisma.WargaWhereInput => {
  switch (status) {
    case "TETAP":
      return { statusDomisili: "AKTIF", keluarga: { statusHunian: "PEMILIK" } };
    case "KONTRAK":
      return { statusDomisili: "AKTIF", keluarga: { statusHunian: "PENYEWA" } };
    case "PINDAH":
    case "MENINGGAL":
      return { statusDomisili: status };
    case "AKTIF":
      return { statusDomisili: "AKTIF" };
    default:
      return {};
  }
};

/** Kata kunci cocok dengan nama, kode rumah (G-12), atau 4 digit akhir NIK (khusus peran berizin identitas). */
export const filterCari = (q: string | undefined, identitas: boolean): Prisma.WargaWhereInput => {
  if (!q) return {};
  const atau: Prisma.WargaWhereInput[] = [{ namaLengkap: { contains: q, mode: "insensitive" } }];
  const kode = /^([a-z]+)\s*[-\s]?\s*0*(\d+)$/i.exec(q);
  if (kode) {
    atau.push({ keluarga: { rumah: { blok: { equals: kode[1]!, mode: "insensitive" }, nomor: kode[2]! } } });
  } else {
    atau.push({ keluarga: { rumah: { blok: { contains: q, mode: "insensitive" } } } });
  }
  if (identitas && /^\d{4}$/.test(q)) atau.push({ nikAkhir4: q });
  return { OR: atau };
};

export async function daftarWarga({
  q,
  status,
  halaman,
  identitas = false,
  denganIuran = false,
}: {
  q?: string;
  status?: string;
  halaman: number;
  identitas?: boolean;
  denganIuran?: boolean;
}) {
  const where: Prisma.WargaWhereInput = { AND: [filterTab(status), filterCari(q, identitas)] };
  const hariIniDb = tanggalUtc(hariIni());

  const [baris, total, semua, aktif, tetap, kontrak, pindah, kepala, rumahTerisi, rumahNunggak] = await Promise.all([
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
        ...(identitas ? { nikAkhir4: true } : {}),
        keluarga: { select: { statusHunian: true, rumah: { select: { id: true, blok: true, nomor: true } } } },
      },
    }),
    db().warga.count({ where }),
    db().warga.count(),
    db().warga.count({ where: { statusDomisili: "AKTIF" } }),
    db().warga.count({ where: filterTab("TETAP") }),
    db().warga.count({ where: filterTab("KONTRAK") }),
    db().warga.count({ where: filterTab("PINDAH") }),
    db().warga.count({ where: { statusDomisili: "AKTIF", hubungan: "KEPALA_KELUARGA" } }),
    db().rumah.count({ where: { keluarga: { some: { tanggalKeluar: null, anggota: { some: { statusDomisili: "AKTIF" } } } } } }),
    denganIuran
      ? db().tagihan.findMany({ where: { status: "UNPAID", jatuhTempo: { lt: hariIniDb } }, distinct: ["rumahId"], select: { rumahId: true } }).then((r) => r.length)
      : Promise.resolve(0),
  ]);

  // Status iuran per rumah, hanya untuk rumah yang tampil di halaman ini.
  const iuran = new Map<string, { nunggak: number; ada: boolean }>();
  if (denganIuran && baris.length) {
    const rumahIds = [...new Set(baris.map((b) => b.keluarga.rumah.id))];
    const [lewat, ada] = await Promise.all([
      db().tagihan.groupBy({ by: ["rumahId"], where: { rumahId: { in: rumahIds }, status: "UNPAID", jatuhTempo: { lt: hariIniDb } }, _count: { _all: true } }),
      db().tagihan.groupBy({ by: ["rumahId"], where: { rumahId: { in: rumahIds }, status: { in: ["UNPAID", "PAID"] } }, _count: { _all: true } }),
    ]);
    for (const id of rumahIds) iuran.set(id, { nunggak: lewat.find((x) => x.rumahId === id)?._count._all ?? 0, ada: ada.some((x) => x.rumahId === id) });
  }

  return {
    baris,
    total,
    iuran,
    hitung: { SEMUA: semua, TETAP: tetap, KONTRAK: kontrak, PINDAH: pindah } satisfies Record<TabWarga, number>,
    statistik: { aktif, kepala, rumahTerisi, rumahNunggak },
  };
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

/** Rumah beserta keluarga yang masih tinggal, untuk pilihan pada formulir tambah warga manual. */
export const rumahUntukPilihan = () =>
  db().rumah.findMany({
    orderBy: [{ blok: "asc" }, { nomor: "asc" }],
    select: {
      id: true,
      blok: true,
      nomor: true,
      keluarga: {
        where: { tanggalKeluar: null },
        orderBy: { dibuatPada: "asc" },
        select: {
          id: true,
          statusHunian: true,
          anggota: { where: { hubungan: "KEPALA_KELUARGA", statusDomisili: "AKTIF" }, select: { namaLengkap: true }, take: 1 },
          _count: { select: { anggota: true } },
        },
      },
    },
  });
