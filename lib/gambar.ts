import sharp from "sharp";
import { tipeDariIsi } from "@/lib/bukti";

/**
 * Mengolah gambar yang akan dilayani ke publik (galeri dan sampul artikel).
 *
 * Selalu diolah ulang di server, tidak pernah disimpan apa adanya: diputar
 * sesuai EXIF lalu metadata dibuang (foto kamera memuat lokasi GPS),
 * diperkecil, dan dikonversi ke WebP. Hasilnya kecil dan aman dilayani publik.
 * Tipe ditentukan dari ISI berkas, bukan dari nama atau tipe kiriman klien.
 * Hanya JPG, PNG, dan WebP. SVG dan PDF ditolak.
 */
export const MAKS_GAMBAR_MENTAH = 12 * 1024 * 1024;
export const SISI_MAKS = 1600;

export type GambarOlahan = {
  data: Uint8Array<ArrayBuffer>;
  tipe: "image/webp";
  lebar: number;
  tinggi: number;
  ukuran: number;
};

export async function olahGambar(
  f: unknown,
): Promise<{ ok: true; gambar: GambarOlahan } | { ok: false; pesan: string }> {
  if (!(f instanceof File) || f.size === 0) return { ok: false, pesan: "Pilih berkas gambar." };
  if (f.size > MAKS_GAMBAR_MENTAH) return { ok: false, pesan: "Gambar terlalu besar. Maksimal 12 MB." };

  const mentah = new Uint8Array(await f.arrayBuffer());
  const tipe = tipeDariIsi(mentah);
  if (tipe !== "image/jpeg" && tipe !== "image/png" && tipe !== "image/webp") {
    return { ok: false, pesan: "Berkas harus berupa gambar JPG, PNG, atau WebP." };
  }

  try {
    const { data, info } = await sharp(mentah, { limitInputPixels: 50_000_000, failOn: "error" })
      .rotate()
      .resize({ width: SISI_MAKS, height: SISI_MAKS, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    const bersih = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
    return { ok: true, gambar: { data: bersih, tipe: "image/webp", lebar: info.width, tinggi: info.height, ukuran: bersih.length } };
  } catch {
    return { ok: false, pesan: "Gambar rusak atau tidak bisa dibaca." };
  }
}
