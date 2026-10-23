/**
 * Label dan pilihan untuk enum data warga. Ditulis sebagai literal, bukan
 * diimpor dari klien Prisma, supaya komponen peramban tidak ikut membawa
 * kode Prisma.
 */
export const HUBUNGAN = [
  "KEPALA_KELUARGA",
  "PASANGAN",
  "ANAK",
  "ORANG_TUA",
  "FAMILI_LAIN",
  "LAINNYA",
] as const;
export const HUNIAN = ["PEMILIK", "PENYEWA", "LAINNYA"] as const;
export const JENIS_KELAMIN = ["LAKI_LAKI", "PEREMPUAN"] as const;
export const DOMISILI = ["AKTIF", "PINDAH", "MENINGGAL"] as const;

export type Hubungan = (typeof HUBUNGAN)[number];
export type Hunian = (typeof HUNIAN)[number];
export type JenisKelamin = (typeof JENIS_KELAMIN)[number];
export type Domisili = (typeof DOMISILI)[number];

export const LABEL_HUBUNGAN: Record<Hubungan, string> = {
  KEPALA_KELUARGA: "Kepala keluarga",
  PASANGAN: "Pasangan",
  ANAK: "Anak",
  ORANG_TUA: "Orang tua",
  FAMILI_LAIN: "Famili lain",
  LAINNYA: "Lainnya",
};
export const LABEL_HUNIAN: Record<Hunian, string> = {
  PEMILIK: "Pemilik",
  PENYEWA: "Penyewa",
  LAINNYA: "Lainnya",
};
export const LABEL_JK: Record<JenisKelamin, string> = {
  LAKI_LAKI: "Laki-laki",
  PEREMPUAN: "Perempuan",
};
export const LABEL_DOMISILI: Record<Domisili, string> = {
  AKTIF: "Aktif",
  PINDAH: "Pindah",
  MENINGGAL: "Meninggal",
};

export const kodeRumah = (r: { blok: string; nomor: string }) =>
  `${r.blok}-${r.nomor}`;
