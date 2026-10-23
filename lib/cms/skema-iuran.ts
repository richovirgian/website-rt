import { z } from "zod";
import { FREKUENSI } from "@/lib/iuran-label";

/**
 * Skema masukan iuran dan tagihan. Nominal diterima sebagai rupiah bulat
 * dalam bentuk teks, lalu diubah menjadi angka: formulir tidak pernah
 * mengirim desimal, dan teks mencegah pembulatan float di peramban.
 */

export const MAKS_NOMINAL = 100_000_000;

const nominal = (nama: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,9}$/, `${nama} harus berupa angka rupiah tanpa titik atau koma.`)
    .transform(Number)
    .refine((n) => n > 0, `${nama} harus lebih dari nol.`)
    .refine((n) => n <= MAKS_NOMINAL, `${nama} terlalu besar.`);

const tanggal = (nama: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${nama} wajib diisi.`)
    .refine(
      (s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s),
      `${nama} tidak valid.`,
    );

const dasarJenis = {
  nama: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(60, "Nama maksimal 60 karakter."),
  deskripsi: z
    .string()
    .trim()
    .max(300, "Deskripsi maksimal 300 karakter.")
    .transform((s) => (s === "" ? null : s)),
  frekuensi: z.enum(FREKUENSI, "Frekuensi tidak dikenal."),
  hariJatuhTempo: z.coerce
    .number("Tanggal jatuh tempo harus angka.")
    .int("Tanggal jatuh tempo harus bilangan bulat.")
    .min(1, "Tanggal jatuh tempo antara 1 dan 28.")
    .max(28, "Tanggal jatuh tempo antara 1 dan 28."),
  terbitOtomatis: z.boolean(),
  aktif: z.boolean(),
};

export const jenisIuranBaru = z
  .object({
    ...dasarJenis,
    nominal: nominal("Nominal"),
    berlakuMulai: tanggal("Tanggal berlaku"),
  })
  .refine((d) => !(d.terbitOtomatis && d.frekuensi !== "BULANAN"), {
    path: ["terbitOtomatis"],
    message: "Terbit otomatis hanya untuk iuran bulanan.",
  });
export type JenisIuranBaru = z.input<typeof jenisIuranBaru>;

export const jenisIuranUbah = z
  .object(dasarJenis)
  .refine((d) => !(d.terbitOtomatis && d.frekuensi !== "BULANAN"), {
    path: ["terbitOtomatis"],
    message: "Terbit otomatis hanya untuk iuran bulanan.",
  });
export type JenisIuranUbah = z.input<typeof jenisIuranUbah>;

export const nominalBaru = z.object({
  nominal: nominal("Nominal"),
  berlakuMulai: tanggal("Tanggal berlaku"),
});
export type NominalBaru = z.input<typeof nominalBaru>;

export const terbitkanMasuk = z
  .object({
    jenisIuranId: z.string().uuid("Pilih jenis iuran."),
    periode: z.string().trim().min(1, "Periode wajib diisi."),
    jatuhTempo: tanggal("Jatuh tempo"),
    mode: z.enum(["SEMUA", "PILIH"]),
    rumahIds: z.array(z.string().uuid()).max(2000),
    /** Kosong berarti pakai nominal yang berlaku. */
    nominalKhusus: z
      .string()
      .trim()
      .refine((s) => s === "" || /^\d{1,9}$/.test(s), "Nominal harus berupa angka rupiah.")
      .transform((s) => (s === "" ? null : Number(s)))
      .refine((n) => n === null || (n > 0 && n <= MAKS_NOMINAL), "Nominal tidak valid."),
  })
  .refine((d) => d.mode === "SEMUA" || d.rumahIds.length > 0, {
    path: ["rumahIds"],
    message: "Pilih minimal satu rumah.",
  });
export type TerbitkanMasuk = z.input<typeof terbitkanMasuk>;

export const batalkanMasuk = z.object({
  alasan: z
    .string()
    .trim()
    .min(5, "Alasan minimal 5 karakter.")
    .max(300, "Alasan maksimal 300 karakter."),
});
