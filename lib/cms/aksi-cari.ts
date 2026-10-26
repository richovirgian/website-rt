"use server";

import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { filterCari } from "@/lib/warga";
import { kodeRumah, LABEL_HUBUNGAN } from "@/lib/warga-label";

export type HasilCari = {
  warga: { id: string; nama: string; keterangan: string }[];
  rumah: { id: string; kode: string; keterangan: string }[];
};

const KOSONG: HasilCari = { warga: [], rumah: [] };

/**
 * Pencarian cepat untuk kotak "Cari apa saja". Hanya peran yang boleh membaca
 * data warga yang mendapat hasil; selain itu jawabannya kosong (halaman menu
 * tetap bisa dicari di sisi klien). Paling banyak 6 hasil per jenis.
 */
export async function cariCepat(mentah: string): Promise<HasilCari> {
  const cek = await periksaIzinAksi("residents.read");
  if (!cek.ok) return KOSONG;
  const q = String(mentah ?? "").trim().slice(0, 60);
  if (q.length < 2) return KOSONG;

  try {
    const kode = /^([a-z]+)\s*[-\s]?\s*0*(\d+)$/i.exec(q);
    const [warga, rumah] = await Promise.all([
      db().warga.findMany({
        where: filterCari(q, false),
        orderBy: { namaLengkap: "asc" },
        take: 6,
        select: { id: true, namaLengkap: true, hubungan: true, keluarga: { select: { rumah: { select: { blok: true, nomor: true } } } } },
      }),
      db().rumah.findMany({
        where: kode
          ? { blok: { equals: kode[1]!, mode: "insensitive" }, nomor: kode[2]! }
          : { OR: [{ blok: { contains: q, mode: "insensitive" } }, { alamat: { contains: q, mode: "insensitive" } }] },
        orderBy: [{ blok: "asc" }, { nomor: "asc" }],
        take: 6,
        select: { id: true, blok: true, nomor: true, alamat: true },
      }),
    ]);
    return {
      warga: warga.map((w) => ({ id: w.id, nama: w.namaLengkap, keterangan: `${kodeRumah(w.keluarga.rumah)} · ${LABEL_HUBUNGAN[w.hubungan]}` })),
      rumah: rumah.map((r) => ({ id: r.id, kode: kodeRumah(r), keterangan: r.alamat ?? "" })),
    };
  } catch {
    return KOSONG;
  }
}
