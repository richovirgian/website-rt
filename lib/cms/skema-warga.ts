import { z } from "zod";
import {
  DOMISILI,
  HUBUNGAN,
  HUNIAN,
  JENIS_KELAMIN,
} from "@/lib/warga-label";

/**
 * Skema masukan untuk rumah, keluarga, dan warga. Dipakai server action dan
 * pengimpor CSV, jadi aturan yang sama berlaku di kedua jalur masuk.
 *
 * Isian formulir selalu berupa string, dan isian kosong dikirim sebagai "".
 * Pembantu di bawah mengubah "" menjadi null.
 */

const teksOpsional = (maks: number, nama: string) =>
  z
    .string()
    .trim()
    .max(maks, `${nama} maksimal ${maks} karakter.`)
    .transform((s) => (s === "" ? null : s));

const tanggalOpsional = (nama: string) =>
  z
    .string()
    .trim()
    .refine(
      (s) =>
        s === "" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(s) &&
          !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) &&
          new Date(`${s}T00:00:00Z`).toISOString().startsWith(s)),
      `${nama} harus berformat tahun-bulan-tanggal yang valid.`,
    )
    .transform((s) => (s === "" ? null : new Date(`${s}T00:00:00Z`)));

const pilihanOpsional = <T extends readonly [string, ...string[]]>(
  nilai: T,
  nama: string,
) =>
  z
    .string()
    .trim()
    .refine((s) => s === "" || (nilai as readonly string[]).includes(s), `${nama} tidak dikenal.`)
    .transform((s) => (s === "" ? null : (s as T[number])));

export const rumahMasuk = z.object({
  blok: z
    .string()
    .trim()
    .min(1, "Blok wajib diisi.")
    .max(10, "Blok maksimal 10 karakter.")
    .transform((s) => s.toUpperCase()),
  nomor: z
    .string()
    .trim()
    .min(1, "Nomor rumah wajib diisi.")
    .max(10, "Nomor maksimal 10 karakter.")
    .transform((s) => s.toUpperCase()),
  alamat: teksOpsional(200, "Alamat"),
  catatan: teksOpsional(500, "Catatan"),
});
export type RumahMasuk = z.input<typeof rumahMasuk>;

export const keluargaMasuk = z
  .object({
    rumahId: z.string().uuid("Rumah tidak valid."),
    statusHunian: z.enum(HUNIAN, "Status hunian tidak dikenal."),
    tanggalMasuk: tanggalOpsional("Tanggal masuk"),
    tanggalKeluar: tanggalOpsional("Tanggal keluar"),
    catatan: teksOpsional(500, "Catatan"),
  })
  .refine(
    (d) => !d.tanggalMasuk || !d.tanggalKeluar || d.tanggalKeluar >= d.tanggalMasuk,
    { path: ["tanggalKeluar"], message: "Tanggal keluar tidak boleh sebelum tanggal masuk." },
  );
export type KeluargaMasuk = z.input<typeof keluargaMasuk>;

export const NIK_POLA = /^\d{16}$/;

export const wargaMasuk = z.object({
  keluargaId: z.string().uuid("Keluarga tidak valid."),
  namaLengkap: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  /** Kosong berarti tidak diubah (saat ubah) atau tidak diisi (saat baru). */
  nik: z
    .string()
    .trim()
    .refine((s) => s === "" || NIK_POLA.test(s), "NIK harus 16 digit angka.")
    .transform((s) => (s === "" ? null : s)),
  jenisKelamin: pilihanOpsional(JENIS_KELAMIN, "Jenis kelamin"),
  tempatLahir: teksOpsional(80, "Tempat lahir"),
  tanggalLahir: tanggalOpsional("Tanggal lahir"),
  hubungan: z.enum(HUBUNGAN, "Hubungan keluarga tidak dikenal."),
  statusDomisili: z.enum(DOMISILI, "Status domisili tidak dikenal."),
  noHp: z
    .string()
    .trim()
    .refine((s) => s === "" || /^\+?\d{8,15}$/.test(s.replace(/[\s-]/g, "")), "Nomor HP tidak valid.")
    .transform((s) => (s === "" ? null : s.replace(/[\s-]/g, ""))),
  pekerjaan: teksOpsional(80, "Pekerjaan"),
}).refine((d) => !d.tanggalLahir || d.tanggalLahir <= new Date(), {
  path: ["tanggalLahir"],
  message: "Tanggal lahir tidak boleh di masa depan.",
});
export type WargaMasuk = z.input<typeof wargaMasuk>;

export const akunWargaMasuk = z.object({
  email: z.string().trim().toLowerCase().email("Format email belum benar.").max(120),
  sandi: z
    .string()
    .min(12, "Sandi minimal 12 karakter.")
    .max(100, "Sandi maksimal 100 karakter."),
});
export type AkunWargaMasuk = z.input<typeof akunWargaMasuk>;
