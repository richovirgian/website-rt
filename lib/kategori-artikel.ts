/** Konstanta kategori artikel; tanpa dependensi server supaya aman dipakai di komponen klien. */
export const LABEL_KATEGORI_ARTIKEL = {
  KEGIATAN: "Kegiatan",
  KEAMANAN: "Keamanan",
  KEUANGAN: "Keuangan",
  LINGKUNGAN: "Lingkungan",
  PENGUMUMAN: "Pengumuman",
} as const;
export type KategoriArtikelDb = keyof typeof LABEL_KATEGORI_ARTIKEL;
export const KATEGORI_ARTIKEL_DB = Object.keys(LABEL_KATEGORI_ARTIKEL) as KategoriArtikelDb[];
