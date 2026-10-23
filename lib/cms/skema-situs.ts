import { z } from "zod";
import { KATEGORI_ARTIKEL_DB } from "@/lib/kategori-artikel";

const teksOpsional = (maks: number, nama: string) =>
  z.string().trim().max(maks, `${nama} maksimal ${maks} karakter.`).transform((s) => (s === "" ? null : s));

export const artikelMasuk = z.object({
  judul: z.string().trim().min(5, "Judul minimal 5 karakter.").max(120, "Judul maksimal 120 karakter."),
  kategori: z.enum(KATEGORI_ARTIKEL_DB as [string, ...string[]], "Kategori tidak dikenal."),
  ringkas: z.string().trim().min(10, "Ringkasan minimal 10 karakter.").max(300, "Ringkasan maksimal 300 karakter."),
  isi: z.string().trim().min(30, "Isi artikel minimal 30 karakter.").max(20000, "Isi artikel maksimal 20000 karakter."),
  penulis: z.string().trim().min(2, "Penulis wajib diisi.").max(60, "Penulis maksimal 60 karakter."),
  tanggal: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib diisi.")
    .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "Tanggal tidak valid."),
  status: z.enum(["DRAFT", "TERBIT"], "Pilih status."),
});

export const fotoMasuk = z.object({
  judul: z.string().trim().min(2, "Judul minimal 2 karakter.").max(80, "Judul maksimal 80 karakter."),
  keterangan: teksOpsional(160, "Keterangan"),
});

export const ubahFotoMasuk = fotoMasuk.extend({
  urutan: z.coerce.number("Urutan harus angka.").int("Urutan harus bilangan bulat.").min(0, "Urutan minimal 0.").max(9999, "Urutan maksimal 9999."),
});

export const pengurusMasuk = z.object({
  tingkat: z.enum(["KETUA", "INTI", "SEKSI"], "Pilih tingkat."),
  jabatan: z.string().trim().min(2, "Jabatan wajib diisi.").max(60, "Jabatan maksimal 60 karakter."),
  nama: z.string().trim().min(2, "Nama wajib diisi.").max(80, "Nama maksimal 80 karakter."),
  tugas: z.string().trim().min(3, "Tugas wajib diisi.").max(160, "Tugas maksimal 160 karakter."),
  urutan: z.coerce.number("Urutan harus angka.").int("Urutan harus bilangan bulat.").min(0, "Urutan minimal 0.").max(9999, "Urutan maksimal 9999."),
});
export type PengurusMasuk = z.input<typeof pengurusMasuk>;
