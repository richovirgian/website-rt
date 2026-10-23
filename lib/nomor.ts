import type { Prisma } from "@/lib/generated/prisma";
import { hariIni } from "@/lib/uang";

/**
 * Nomor urut berformat, misalnya KWT-2026-00001 (kuitansi), KAS-2026-00001
 * (transaksi kas), ADU-2026-00001 (pengaduan), dan SPN-2026-00001 (surat). Urutan direset tiap tahun.
 *
 * Dinaikkan dengan `upsert ... increment` di dalam transaksi pemanggil. Baris
 * urutan terkunci sampai transaksi selesai, jadi dua penulisan bersamaan
 * tidak pernah mendapat nomor yang sama, dan transaksi yang dibatalkan tidak
 * meninggalkan lubang nomor.
 */
export async function nomorBerikut(
  tx: Prisma.TransactionClient,
  /** KWT (kuitansi), KAS (kas), ADU (pengaduan), atau kode jenis surat. */
  awalan: string,
): Promise<string> {
  const tahun = hariIni().slice(0, 4);
  const kunci = `${awalan}-${tahun}`;
  const u = await tx.urutan.upsert({
    where: { kunci },
    create: { kunci, nilai: 1 },
    update: { nilai: { increment: 1 } },
  });
  return `${kunci}-${String(u.nilai).padStart(5, "0")}`;
}
