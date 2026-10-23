/**
 * Memperkecil foto di peramban SEBELUM diunggah. Foto kamera ponsel sering
 * 3 sampai 8 MB, sedangkan hosting membatasi ukuran permintaan (sekitar
 * 4,5 MB di Vercel) dan server menolak lampiran di atas 2 MB. Diperkecil
 * dulu, unggahan jauh lebih cepat di jaringan seluler.
 *
 * Hanya JPG, PNG, dan WebP. Berkas lain (PDF) tidak disentuh. Bila apa pun
 * gagal, berkas asli dikirim apa adanya dan server yang memutuskan.
 */
export async function kecilkanGambar(f: File, maksSisi = 1600, kualitas = 0.85): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return f;
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
    const sisi = Math.max(bmp.width, bmp.height);
    // Sudah kecil dan ukurannya wajar: jangan dikompres ulang (menjaga ketajaman tangkapan layar).
    if (f.size <= 600 * 1024 && sisi <= maksSisi) {
      bmp.close();
      return f;
    }
    const skala = Math.min(1, maksSisi / sisi);
    const lebar = Math.round(bmp.width * skala);
    const tinggi = Math.round(bmp.height * skala);
    const kanvas = document.createElement("canvas");
    kanvas.width = lebar;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      return f;
    }
    // Latar putih: PNG transparan jadi hitam bila disimpan sebagai JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, lebar, tinggi);
    ctx.drawImage(bmp, 0, 0, lebar, tinggi);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => kanvas.toBlob(r, "image/jpeg", kualitas));
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return f;
  }
}

/** Mengganti semua berkas pada field `nama` di FormData dengan versi yang diperkecil. */
export async function kecilkanFormData(data: FormData, nama: string): Promise<FormData> {
  const semua = data.getAll(nama);
  if (semua.length === 0) return data;
  data.delete(nama);
  for (const f of semua) data.append(nama, f instanceof File ? await kecilkanGambar(f) : f);
  return data;
}

/** Foto boleh besar (akan diperkecil); selain foto, batasnya tetap 2 MB. */
export const MAKS_MENTAH_FOTO = 20 * 1024 * 1024;
export const bolehDiunggah = (f: File, maksBukan = 2 * 1024 * 1024) =>
  /^image\/(jpeg|png|webp)$/.test(f.type) ? f.size <= MAKS_MENTAH_FOTO : f.size <= maksBukan;
