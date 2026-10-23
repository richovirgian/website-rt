/**
 * Validasi berkas bukti transfer. Tipe ditentukan dari ISI berkas (byte
 * awal), bukan dari nama atau tipe yang dikirim peramban, yang bisa dipalsu.
 * SVG dan HTML tidak diterima: keduanya dapat memuat skrip.
 */
export const MAKS_BUKTI = 2 * 1024 * 1024;

export const TIPE_BUKTI = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;
export type TipeBukti = keyof typeof TIPE_BUKTI;

export function tipeDariIsi(b: Uint8Array): TipeBukti | null {
  const s = (i: number) => b[i];
  if (s(0) === 0xff && s(1) === 0xd8 && s(2) === 0xff) return "image/jpeg";
  if (s(0) === 0x89 && s(1) === 0x50 && s(2) === 0x4e && s(3) === 0x47) return "image/png";
  if (
    s(0) === 0x52 && s(1) === 0x49 && s(2) === 0x46 && s(3) === 0x46 &&
    s(8) === 0x57 && s(9) === 0x45 && s(10) === 0x42 && s(11) === 0x50
  ) return "image/webp";
  if (s(0) === 0x25 && s(1) === 0x50 && s(2) === 0x44 && s(3) === 0x46) return "application/pdf";
  return null;
}

export async function periksaBerkas(
  f: unknown,
): Promise<{ ok: true; tipe: TipeBukti; data: Uint8Array<ArrayBuffer>; nama: string } | { ok: false; pesan: string }> {
  if (!(f instanceof File) || f.size === 0) {
    return { ok: false, pesan: "Pilih berkas bukti transfer." };
  }
  if (f.size > MAKS_BUKTI) {
    return { ok: false, pesan: "Berkas terlalu besar. Maksimal 2 MB." };
  }
  const data = new Uint8Array(await f.arrayBuffer());
  const tipe = tipeDariIsi(data);
  if (!tipe) {
    return { ok: false, pesan: "Berkas harus berupa foto (JPG, PNG, WebP) atau PDF." };
  }
  // Nama dari pengguna hanya untuk tampilan; dibersihkan dan dipendekkan.
  const nama = (f.name || "bukti").replace(/[^\w.\- ]+/g, "_").slice(0, 80) || "bukti";
  return { ok: true, tipe, data, nama };
}
