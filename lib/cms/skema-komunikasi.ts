import { z } from "zod";
import { placeholderTakDikenal } from "@/lib/surat";
import {
  JENIS_KEGIATAN,
  KATEGORI_PENGADUAN,
  KATEGORI_PENGUMUMAN,
  STATUS_PENGADUAN,
} from "@/lib/komunikasi-label";

const teksOpsional = (maks: number, nama: string) =>
  z.string().trim().max(maks, `${nama} maksimal ${maks} karakter.`).transform((s) => (s === "" ? null : s));

const tanggal = (nama: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${nama} wajib diisi.`)
    .refine((s) => new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), `${nama} tidak valid.`);

const jam = (nama: string) => z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${nama} harus berformat jam:menit.`);

/* ------------------------------------------------------------------ Surat */

export const jenisSuratMasuk = z.object({
  nama: z.string().trim().min(3, "Nama minimal 3 karakter.").max(60, "Nama maksimal 60 karakter."),
  kode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2,6}$/, "Kode 2 sampai 6 huruf, contoh SPN."),
  deskripsi: teksOpsional(200, "Deskripsi"),
  templat: z
    .string()
    .trim()
    .min(20, "Templat terlalu pendek.")
    .max(3000, "Templat maksimal 3000 karakter.")
    .superRefine((t, ctx) => {
      const tak = placeholderTakDikenal(t);
      if (tak.length > 0) {
        ctx.addIssue({ code: "custom", message: `Penanda tidak dikenal: ${tak.map((x) => `{{${x}}}`).join(", ")}.` });
      }
    }),
  aktif: z.boolean(),
});
export type JenisSuratMasuk = z.input<typeof jenisSuratMasuk>;

export const ajukanSuratMasuk = z.object({
  jenisSuratId: z.string().uuid("Pilih jenis surat."),
  keperluan: z.string().trim().min(10, "Jelaskan keperluan minimal 10 karakter.").max(500, "Keperluan maksimal 500 karakter."),
});

export const kirimUlangSuratMasuk = z.object({
  keperluan: z.string().trim().min(10, "Jelaskan keperluan minimal 10 karakter.").max(500, "Keperluan maksimal 500 karakter."),
});

export const putusanSuratMasuk = z
  .object({
    tindakan: z.enum(["SETUJUI", "REVISI", "TOLAK"], "Pilih tindakan."),
    alasan: z.string().trim().max(300, "Alasan maksimal 300 karakter."),
  })
  .refine((d) => d.tindakan === "SETUJUI" || d.alasan.length >= 5, {
    path: ["alasan"],
    message: "Alasan minimal 5 karakter.",
  });
export type PutusanSuratMasuk = z.input<typeof putusanSuratMasuk>;

/* -------------------------------------------------------------- Pengumuman */

export const pengumumanMasuk = z
  .object({
    judul: z.string().trim().min(3, "Judul minimal 3 karakter.").max(120, "Judul maksimal 120 karakter."),
    isi: z.string().trim().min(10, "Isi minimal 10 karakter.").max(5000, "Isi maksimal 5000 karakter."),
    kategori: z.enum(KATEGORI_PENGUMUMAN, "Kategori tidak dikenal."),
    /** TETAP hanya saat menyunting pengumuman yang sudah terbit: status dan waktu terbit tidak berubah. */
    mode: z.enum(["DRAFT", "SEKARANG", "JADWAL", "TETAP"]),
    tanggalTerbit: z.string().trim(),
    jamTerbit: z.string().trim(),
    disematkan: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.mode !== "JADWAL") return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.tanggalTerbit)) ctx.addIssue({ code: "custom", path: ["tanggalTerbit"], message: "Tanggal terbit wajib diisi." });
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.jamTerbit)) ctx.addIssue({ code: "custom", path: ["jamTerbit"], message: "Jam terbit wajib diisi." });
  });
export type PengumumanMasuk = z.input<typeof pengumumanMasuk>;

/* --------------------------------------------------------------- Pengaduan */

export const pengaduanMasuk = z.object({
  kategori: z.enum(KATEGORI_PENGADUAN, "Pilih kategori."),
  judul: z.string().trim().min(5, "Judul minimal 5 karakter.").max(100, "Judul maksimal 100 karakter."),
  deskripsi: z.string().trim().min(10, "Jelaskan masalahnya minimal 10 karakter.").max(1500, "Deskripsi maksimal 1500 karakter."),
  lokasi: teksOpsional(120, "Lokasi"),
});

export const tanggapanMasuk = z.object({
  catatan: z.string().trim().min(3, "Tulis minimal 3 karakter.").max(1000, "Maksimal 1000 karakter."),
});

export const statusPengaduanMasuk = z.object({
  status: z.enum(STATUS_PENGADUAN, "Status tidak dikenal."),
  penanggungJawab: teksOpsional(100, "Penanggung jawab"),
  catatan: teksOpsional(1000, "Catatan"),
});
export type StatusPengaduanMasuk = z.input<typeof statusPengaduanMasuk>;

/* ---------------------------------------------------------------- Kegiatan */

export const kegiatanMasuk = z
  .object({
    judul: z.string().trim().min(3, "Judul minimal 3 karakter.").max(120, "Judul maksimal 120 karakter."),
    deskripsi: teksOpsional(1000, "Deskripsi"),
    jenis: z.enum(JENIS_KEGIATAN, "Jenis tidak dikenal."),
    tanggal: tanggal("Tanggal"),
    jamMulai: jam("Jam mulai"),
    jamSelesai: z.string().trim().refine((s) => s === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(s), "Jam selesai harus berformat jam:menit.").transform((s) => (s === "" ? null : s)),
    lokasi: z.string().trim().min(2, "Lokasi wajib diisi.").max(120, "Lokasi maksimal 120 karakter."),
    penanggungJawab: teksOpsional(100, "Penanggung jawab"),
  })
  .refine((d) => !d.jamSelesai || d.jamSelesai > d.jamMulai, {
    path: ["jamSelesai"],
    message: "Jam selesai harus setelah jam mulai.",
  });
export type KegiatanMasuk = z.input<typeof kegiatanMasuk>;
