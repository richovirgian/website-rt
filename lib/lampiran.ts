import { periksaBerkas, type TipeBukti } from "@/lib/bukti";

/**
 * Lampiran untuk surat, pengaduan, dan pengumuman. Aturannya sama dengan
 * bukti transfer: tipe ditentukan dari isi berkas, maksimal 2 MB per berkas.
 */
export const MAKS_LAMPIRAN = 3;

export type LampiranSiap = {
  namaBerkas: string;
  tipe: TipeBukti;
  ukuran: number;
  data: Uint8Array<ArrayBuffer>;
};

/** Membaca semua berkas pada field `nama` di FormData. Kosong bila tidak ada yang dipilih. */
export async function periksaLampiran(
  formData: FormData,
  nama = "lampiran",
): Promise<{ ok: true; berkas: LampiranSiap[] } | { ok: false; pesan: string }> {
  const semua = formData.getAll(nama).filter((f): f is File => f instanceof File && f.size > 0);
  if (semua.length > MAKS_LAMPIRAN) {
    return { ok: false, pesan: `Maksimal ${MAKS_LAMPIRAN} berkas.` };
  }
  const berkas: LampiranSiap[] = [];
  for (const f of semua) {
    const h = await periksaBerkas(f);
    if (!h.ok) return { ok: false, pesan: `${f.name}: ${h.pesan}` };
    berkas.push({ namaBerkas: h.nama, tipe: h.tipe, ukuran: h.data.length, data: h.data });
  }
  return { ok: true, berkas };
}
