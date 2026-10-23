import { z } from "zod";
import { PERAN } from "@/lib/izin";

const teks = (min: number, max: number, nama: string) =>
  z
    .string()
    .trim()
    .min(min, `${nama} minimal ${min} karakter.`)
    .max(max, `${nama} maksimal ${max} karakter.`);

/* ----------------------------------------------------------- Pengguna --- */

export const peranEnum = z.enum(PERAN);

export const penggunaBaruMasuk = z.object({
  nama: teks(2, 80, "Nama"),
  email: z.string().trim().email("Format email belum benar.").max(120),
  sandi: z
    .string()
    .min(12, "Sandi minimal 12 karakter.")
    .max(100, "Sandi maksimal 100 karakter."),
  role: peranEnum.default("warga"),
});

export const ubahPeranMasuk = z.object({
  role: peranEnum,
});

export const ubahSandiMasuk = z.object({
  sandi: z
    .string()
    .min(12, "Sandi minimal 12 karakter.")
    .max(100, "Sandi maksimal 100 karakter."),
});

export type PenggunaBaruMasuk = z.infer<typeof penggunaBaruMasuk>;
export type UbahPeranMasuk = z.infer<typeof ubahPeranMasuk>;
export type UbahSandiMasuk = z.infer<typeof ubahSandiMasuk>;

/* ---------------------------------------------------------- Pengaturan --- */

export const pengaturanRtMasuk = z.object({
  namaRt: teks(2, 80, "Nama RT"),
  alamat: z.string().trim().max(240, "Alamat maksimal 240 karakter."),
  kontak: z.string().trim().max(120, "Kontak maksimal 120 karakter."),
  namaBank: z.string().trim().max(60, "Nama bank maksimal 60 karakter."),
  nomorRekening: z
    .string()
    .trim()
    .max(40, "Nomor rekening maksimal 40 karakter.")
    .regex(/^[0-9 -]*$/, "Nomor rekening hanya boleh berisi angka."),
  atasNamaRekening: z
    .string()
    .trim()
    .max(80, "Atas nama maksimal 80 karakter."),
});

export type PengaturanRtMasuk = z.infer<typeof pengaturanRtMasuk>;
