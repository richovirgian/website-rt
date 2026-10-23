/**
 * Label dan pilihan untuk surat, pengumuman, pengaduan, dan kegiatan. Ditulis
 * sebagai literal supaya komponen peramban tidak ikut membawa klien Prisma.
 */
export const STATUS_SURAT = ["DIAJUKAN", "REVISI", "DISETUJUI", "DITOLAK", "DIBATALKAN"] as const;
export type StatusSurat = (typeof STATUS_SURAT)[number];
export const LABEL_STATUS_SURAT: Record<StatusSurat, string> = {
  DIAJUKAN: "Menunggu persetujuan",
  REVISI: "Perlu revisi",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
  DIBATALKAN: "Dibatalkan",
};
export const NADA_SURAT = { DIAJUKAN: "jingga", REVISI: "merah", DISETUJUI: "hijau", DITOLAK: "merah", DIBATALKAN: "abu" } as const;

export const KATEGORI_PENGUMUMAN = ["UMUM", "PENTING", "KEGIATAN", "KEUANGAN"] as const;
export type KategoriPengumuman = (typeof KATEGORI_PENGUMUMAN)[number];
export const LABEL_KATEGORI_PENGUMUMAN: Record<KategoriPengumuman, string> = {
  UMUM: "Umum",
  PENTING: "Penting",
  KEGIATAN: "Kegiatan",
  KEUANGAN: "Keuangan",
};

export const KATEGORI_PENGADUAN = ["KEBERSIHAN", "KEAMANAN", "FASILITAS", "SOSIAL", "LAINNYA"] as const;
export type KategoriPengaduan = (typeof KATEGORI_PENGADUAN)[number];
export const LABEL_KATEGORI_PENGADUAN: Record<KategoriPengaduan, string> = {
  KEBERSIHAN: "Kebersihan",
  KEAMANAN: "Keamanan",
  FASILITAS: "Fasilitas",
  SOSIAL: "Sosial",
  LAINNYA: "Lainnya",
};

export const STATUS_PENGADUAN = ["BARU", "DITUGASKAN", "DIPROSES", "SELESAI", "DITUTUP"] as const;
export type StatusPengaduan = (typeof STATUS_PENGADUAN)[number];
export const LABEL_STATUS_PENGADUAN: Record<StatusPengaduan, string> = {
  BARU: "Baru",
  DITUGASKAN: "Ditugaskan",
  DIPROSES: "Diproses",
  SELESAI: "Selesai",
  DITUTUP: "Ditutup",
};
export const NADA_PENGADUAN = { BARU: "merah", DITUGASKAN: "jingga", DIPROSES: "jingga", SELESAI: "hijau", DITUTUP: "abu" } as const;

/** Status yang boleh dituju dari status sekarang. Dipakai server dan formulir. */
export const TUJUAN_PENGADUAN: Record<StatusPengaduan, readonly StatusPengaduan[]> = {
  BARU: ["DITUGASKAN", "DIPROSES", "SELESAI", "DITUTUP"],
  DITUGASKAN: ["DIPROSES", "SELESAI", "DITUTUP"],
  DIPROSES: ["SELESAI", "DITUTUP"],
  SELESAI: ["DIPROSES", "DITUTUP"],
  DITUTUP: [],
};

export const JENIS_KEGIATAN = ["RAPAT", "KERJA_BAKTI", "RONDA", "SOSIAL", "LAINNYA"] as const;
export type JenisKegiatan = (typeof JENIS_KEGIATAN)[number];
export const LABEL_JENIS_KEGIATAN: Record<JenisKegiatan, string> = {
  RAPAT: "Rapat warga",
  KERJA_BAKTI: "Kerja bakti",
  RONDA: "Ronda",
  SOSIAL: "Kegiatan sosial",
  LAINNYA: "Lainnya",
};

const ZONA = "Asia/Jakarta";
const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, ...o });

export const formatWaktu = (d: Date) => fmt({ dateStyle: "long", timeStyle: "short" }).format(d).replace(/\./g, ":");
export const formatTanggalPanjang = (d: Date) => fmt({ dateStyle: "full" }).format(d);
export const jamSaja = (d: Date) => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(d).replace(".", ":");
/** "2026-11-08" dan "06:30" (waktu Jakarta) menjadi Date. */
export const waktuJakarta = (tanggalIso: string, jam: string) => new Date(`${tanggalIso}T${jam}:00+07:00`);
/** Tanggal Jakarta "YYYY-MM-DD" dari sebuah Date. */
export const isoJakarta = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
