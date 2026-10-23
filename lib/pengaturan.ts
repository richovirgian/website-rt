import { db } from "@/lib/db";

export type PengaturanRt = {
  namaRt: string;
  alamat: string;
  kontak: string;
  namaBank: string;
  nomorRekening: string;
  atasNamaRekening: string;
};

export const PENGATURAN_BAWAAN: PengaturanRt = {
  namaRt: "Warga Blok G",
  alamat: "RT 04 · RW 07",
  kontak: "",
  namaBank: "",
  nomorRekening: "",
  atasNamaRekening: "",
};

/**
 * Pengaturan RT. Bila belum ada baris atau database belum terjangkau,
 * mengembalikan nilai bawaan supaya halaman publik tetap bisa dirender.
 *
 * Jangan memakai ini di tempat yang harus gagal keras bila database mati
 * (misalnya server action); untuk itu baca langsung lewat db().
 */
export async function pengaturanRt(): Promise<PengaturanRt> {
  try {
    const r = await db().pengaturanRt.findUnique({ where: { id: "rt" } });
    if (!r) return PENGATURAN_BAWAAN;
    return {
      namaRt: r.namaRt,
      alamat: r.alamat,
      kontak: r.kontak,
      namaBank: r.namaBank,
      nomorRekening: r.nomorRekening,
      atasNamaRekening: r.atasNamaRekening,
    };
  } catch {
    return PENGATURAN_BAWAAN;
  }
}
