import { z } from "zod";
import { MAKS_NOMINAL } from "@/lib/cms/skema-iuran";
import { hariIni } from "@/lib/uang";

const tanggalTidakMasaDepan = (nama: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${nama} wajib diisi.`)
    .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), `${nama} tidak valid.`)
    .refine((s) => s <= hariIni(), `${nama} tidak boleh di masa depan.`);

const teksOpsional = (maks: number, nama: string) =>
  z
    .string()
    .trim()
    .max(maks, `${nama} maksimal ${maks} karakter.`)
    .transform((s) => (s === "" ? null : s));

const alasan = z
  .string()
  .trim()
  .min(5, "Alasan minimal 5 karakter.")
  .max(300, "Alasan maksimal 300 karakter.");

export const tunaiMasuk = z.object({
  tanggalBayar: tanggalTidakMasaDepan("Tanggal terima"),
  dibayarOleh: teksOpsional(100, "Nama pembayar"),
  catatan: teksOpsional(300, "Catatan"),
});
export type TunaiMasuk = z.input<typeof tunaiMasuk>;

export const transferMasuk = z.object({
  tanggalBayar: tanggalTidakMasaDepan("Tanggal transfer"),
  catatan: teksOpsional(300, "Catatan"),
});

export const alasanMasuk = z.object({ alasan });

export const kasMasuk = z.object({
  jenis: z.enum(["MASUK", "KELUAR"], "Pilih masuk atau keluar."),
  kategoriId: z.string().uuid("Pilih kategori."),
  nominal: z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, "Nominal harus berupa angka rupiah tanpa titik atau koma.")
    .transform(Number)
    .refine((n) => n > 0 && n <= MAKS_NOMINAL, "Nominal tidak valid."),
  tanggal: tanggalTidakMasaDepan("Tanggal"),
  deskripsi: z
    .string()
    .trim()
    .min(3, "Deskripsi minimal 3 karakter.")
    .max(200, "Deskripsi maksimal 200 karakter."),
});
export type KasMasuk = z.input<typeof kasMasuk>;

export const kategoriMasuk = z.object({
  nama: z.string().trim().min(2, "Nama minimal 2 karakter.").max(40, "Nama maksimal 40 karakter."),
  jenis: z.enum(["MASUK", "KELUAR"]),
});
