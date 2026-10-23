import { db } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma";

/**
 * Kueri baca surat, pengumuman, pengaduan, kegiatan, dan notifikasi.
 * Pemanggil WAJIB sudah memeriksa izin. Data milik warga selalu dicari dari
 * ID akun, bukan dari parameter URL.
 */

export const PER_HALAMAN_KOM = 20;

/** Warga aktif milik akun ini beserta rumahnya, atau null. */
export async function wargaAktifDariUser(userId: string) {
  const w = await db().warga.findUnique({
    where: { userId },
    select: {
      id: true,
      namaLengkap: true,
      statusDomisili: true,
      keluarga: { select: { tanggalKeluar: true, rumah: { select: { id: true, blok: true, nomor: true, alamat: true } } } },
    },
  });
  if (!w || w.statusDomisili !== "AKTIF" || w.keluarga.tanggalKeluar) return null;
  return { id: w.id, namaLengkap: w.namaLengkap, rumah: w.keluarga.rumah };
}

/* ------------------------------------------------------------------ Surat */

export const semuaJenisSurat = () => db().jenisSurat.findMany({ orderBy: [{ aktif: "desc" }, { nama: "asc" }] });
export const jenisSuratAktif = () =>
  db().jenisSurat.findMany({ where: { aktif: true }, orderBy: { nama: "asc" }, select: { id: true, nama: true, deskripsi: true } });

const pilihSurat = {
  id: true,
  keperluan: true,
  status: true,
  nomor: true,
  alasan: true,
  dibuatPada: true,
  diputuskanPada: true,
  jenisSurat: { select: { nama: true } },
  pemohon: { select: { namaLengkap: true, keluarga: { select: { rumah: { select: { blok: true, nomor: true } } } } } },
} satisfies Prisma.PengajuanSuratSelect;

export const suratSaya = (userId: string) =>
  db().pengajuanSurat.findMany({ where: { pemohonUserId: userId }, orderBy: { dibuatPada: "desc" }, take: 100, select: pilihSurat });

export async function daftarSurat({ status, halaman }: { status?: string; halaman: number }) {
  const where: Prisma.PengajuanSuratWhereInput =
    status === "DIAJUKAN" || status === "REVISI" || status === "DISETUJUI" || status === "DITOLAK" || status === "DIBATALKAN" ? { status } : {};
  const [baris, total] = await Promise.all([
    db().pengajuanSurat.findMany({ where, orderBy: { dibuatPada: "desc" }, skip: (halaman - 1) * PER_HALAMAN_KOM, take: PER_HALAMAN_KOM, select: pilihSurat }),
    db().pengajuanSurat.count({ where }),
  ]);
  return { baris, total };
}

export const detailSurat = (id: string) =>
  db().pengajuanSurat.findUnique({
    where: { id },
    select: {
      ...pilihSurat,
      pemohonUserId: true,
      pemohonWargaId: true,
      diputuskanOleh: true,
      templatSnapshot: true,
      jenisSurat: { select: { id: true, nama: true, kode: true } },
      lampiran: { select: { id: true, namaBerkas: true, tipe: true, ukuran: true }, orderBy: { dibuatPada: "asc" } },
    },
  });

/** Data lengkap untuk mencetak surat, termasuk NIK terenkripsi (didekripsi hanya saat dicetak). */
export const dataCetakSurat = (id: string) =>
  db().pengajuanSurat.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      nomor: true,
      keperluan: true,
      templatSnapshot: true,
      diputuskanOleh: true,
      diputuskanPada: true,
      pemohonUserId: true,
      jenisSurat: { select: { nama: true } },
      pemohon: {
        select: {
          namaLengkap: true,
          nikEnkripsi: true,
          keluarga: { select: { rumah: { select: { blok: true, nomor: true, alamat: true } } } },
        },
      },
    },
  });

export const jumlahSuratMenunggu = () => db().pengajuanSurat.count({ where: { status: "DIAJUKAN" } });

/* ------------------------------------------------------------ Pengumuman */

/** Terlihat oleh umum: terbit dan waktunya sudah tiba. */
const terlihat = (): Prisma.PengumumanWhereInput => ({ status: "TERBIT", terbitPada: { lte: new Date() } });

export async function daftarPengumuman({ userId, semua, halaman }: { userId: string; semua: boolean; halaman: number }) {
  const where: Prisma.PengumumanWhereInput = semua ? {} : terlihat();
  const [baris, total] = await Promise.all([
    db().pengumuman.findMany({
      where,
      orderBy: [{ disematkan: "desc" }, { terbitPada: { sort: "desc", nulls: "first" } }, { dibuatPada: "desc" }],
      skip: (halaman - 1) * PER_HALAMAN_KOM,
      take: PER_HALAMAN_KOM,
      select: {
        id: true,
        judul: true,
        isi: true,
        kategori: true,
        status: true,
        terbitPada: true,
        disematkan: true,
        penulis: true,
        _count: { select: { lampiran: true } },
        dibaca: { where: { userId }, select: { userId: true } },
      },
    }),
    db().pengumuman.count({ where }),
  ]);
  return { baris, total };
}

export const detailPengumuman = (id: string, semua: boolean) =>
  db().pengumuman.findFirst({
    where: { id, ...(semua ? {} : terlihat()) },
    include: { lampiran: { select: { id: true, namaBerkas: true, tipe: true, ukuran: true }, orderBy: { dibuatPada: "asc" } } },
  });

export const jumlahPengumumanBelumDibaca = (userId: string) =>
  db().pengumuman.count({ where: { ...terlihat(), dibaca: { none: { userId } } } });

export const pengumumanTerbaru = (userId: string, n = 3) =>
  db().pengumuman.findMany({
    where: terlihat(),
    orderBy: [{ disematkan: "desc" }, { terbitPada: "desc" }],
    take: n,
    select: { id: true, judul: true, kategori: true, terbitPada: true, dibaca: { where: { userId }, select: { userId: true } } },
  });

/* ------------------------------------------------------------- Pengaduan */

const pilihAduan = {
  id: true,
  nomor: true,
  judul: true,
  kategori: true,
  status: true,
  pelaporNama: true,
  penanggungJawab: true,
  dibuatPada: true,
  selesaiPada: true,
  rumah: { select: { blok: true, nomor: true } },
} satisfies Prisma.PengaduanSelect;

export const pengaduanSaya = (userId: string) =>
  db().pengaduan.findMany({ where: { pelaporUserId: userId }, orderBy: { dibuatPada: "desc" }, take: 100, select: pilihAduan });

export async function daftarPengaduan({ status, halaman }: { status?: string; halaman: number }) {
  // "AKTIF" = antrean kerja: yang belum selesai atau ditutup.
  const where: Prisma.PengaduanWhereInput =
    status === "AKTIF"
      ? { status: { in: ["BARU", "DITUGASKAN", "DIPROSES"] } }
      : status === "BARU" || status === "DITUGASKAN" || status === "DIPROSES" || status === "SELESAI" || status === "DITUTUP"
        ? { status }
        : {};
  const [baris, total] = await Promise.all([
    db().pengaduan.findMany({ where, orderBy: { dibuatPada: "desc" }, skip: (halaman - 1) * PER_HALAMAN_KOM, take: PER_HALAMAN_KOM, select: pilihAduan }),
    db().pengaduan.count({ where }),
  ]);
  return { baris, total };
}

export const detailPengaduan = (id: string) =>
  db().pengaduan.findUnique({
    where: { id },
    select: {
      ...pilihAduan,
      deskripsi: true,
      lokasi: true,
      pelaporUserId: true,
      pembaruan: { orderBy: { dibuatPada: "asc" }, select: { id: true, status: true, catatan: true, oleh: true, dariPelapor: true, dibuatPada: true } },
      lampiran: { select: { id: true, namaBerkas: true, tipe: true, ukuran: true }, orderBy: { dibuatPada: "asc" } },
    },
  });

export const jumlahPengaduanBaru = () => db().pengaduan.count({ where: { status: "BARU" } });

/* -------------------------------------------------------------- Kegiatan */

export async function daftarKegiatan(userId: string) {
  const sekarang = new Date();
  const pilih = {
    id: true,
    judul: true,
    jenis: true,
    mulai: true,
    selesai: true,
    lokasi: true,
    status: true,
    peserta: { where: { userId }, select: { hadir: true } },
    _count: { select: { peserta: { where: { hadir: true } } } },
  } satisfies Prisma.KegiatanSelect;
  const [mendatang, lalu] = await Promise.all([
    db().kegiatan.findMany({ where: { mulai: { gte: sekarang }, status: { not: "DIBATALKAN" } }, orderBy: { mulai: "asc" }, take: 50, select: pilih }),
    db().kegiatan.findMany({ where: { OR: [{ mulai: { lt: sekarang } }, { status: "DIBATALKAN" }] }, orderBy: { mulai: "desc" }, take: 20, select: pilih }),
  ]);
  return { mendatang, lalu };
}

export const detailKegiatan = (id: string, userId: string) =>
  db().kegiatan.findUnique({
    where: { id },
    include: {
      peserta: { where: { userId }, select: { hadir: true } },
      _count: { select: { peserta: { where: { hadir: true } } } },
    },
  });

export const kegiatanTerdekat = (n = 3) =>
  db().kegiatan.findMany({
    where: { mulai: { gte: new Date() }, status: "DIJADWALKAN" },
    orderBy: { mulai: "asc" },
    take: n,
    select: { id: true, judul: true, mulai: true, lokasi: true },
  });

/* ------------------------------------------------------------ Notifikasi */

export const jumlahNotifikasiBelumDibaca = (userId: string) =>
  db().notifikasi.count({ where: { userId, dibacaPada: null } });

export async function daftarNotifikasi(userId: string, halaman: number) {
  const where = { userId };
  const [baris, total] = await Promise.all([
    db().notifikasi.findMany({
      where,
      orderBy: { dibuatPada: "desc" },
      skip: (halaman - 1) * PER_HALAMAN_KOM,
      take: PER_HALAMAN_KOM,
      select: { id: true, judul: true, isi: true, tautan: true, dibacaPada: true, dibuatPada: true },
    }),
    db().notifikasi.count({ where }),
  ]);
  return { baris, total };
}
