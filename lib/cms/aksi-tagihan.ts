"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { batalkanMasuk, terbitkanMasuk } from "@/lib/cms/skema-iuran";
import { terbitkanTagihan, type HasilTerbit } from "@/lib/tagihan";

/** Menerbitkan tagihan, individual atau massal. Perlu izin `bills.create`. */
export async function terbitkan(mentah: unknown): Promise<HasilTerbit> {
  const cek = await periksaIzinAksi("bills.create");
  if (!cek.ok) return cek;

  const h = terbitkanMasuk.safeParse(mentah);
  if (!h.success) {
    const g = galatDariZod(h.error);
    return { ok: false, pesan: g.pesan, galat: g.galat };
  }
  const d = h.data;

  const hasil = await terbitkanTagihan({
    jenisIuranId: d.jenisIuranId,
    periode: d.periode,
    jatuhTempo: d.jatuhTempo,
    rumahIds: d.mode === "SEMUA" ? null : d.rumahIds,
    nominalKhusus: d.nominalKhusus,
    aktor: cek.sesi.user.name,
  });

  if (hasil.ok) {
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "tagihan.terbitkan",
      entitas: "tagihan",
      entitasId: d.jenisIuranId,
      metadata: {
        periode: d.periode,
        mode: d.mode,
        dibuat: hasil.dibuat,
        dilewati: hasil.dilewati,
        nominal: hasil.nominal,
      },
    });
    revalidatePath("/admin/tagihan");
  }
  return hasil;
}

/**
 * Membatalkan tagihan yang belum dibayar. Pengecekan status dan perubahan
 * terjadi dalam SATU pernyataan (updateMany dengan syarat status), jadi
 * tagihan yang sedang dibayar bersamaan tidak bisa terbatalkan.
 */
export async function batalkanTagihan(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("bills.cancel");
  if (!cek.ok) return cek;

  const h = batalkanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const r = await db().tagihan.updateMany({
      where: { id, status: "UNPAID" },
      data: {
        status: "CANCELLED",
        dibatalkanAlasan: h.data.alasan,
        dibatalkanOleh: cek.sesi.user.name,
        dibatalkanPada: new Date(),
      },
    });
    if (r.count === 0) {
      return { ok: false, pesan: "Tagihan ini tidak bisa dibatalkan. Mungkin sudah lunas atau sudah dibatalkan." };
    }
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "tagihan.batalkan",
      entitas: "tagihan",
      entitasId: id,
      metadata: { alasan: h.data.alasan },
    });
    revalidatePath("/admin/tagihan");
    return { ok: true, id };
  } catch (e) {
    console.error("[tagihan] gagal membatalkan:", e);
    return { ok: false, pesan: "Gagal membatalkan tagihan." };
  }
}
