import type { Prisma } from "@/lib/generated/prisma";

/** Nama kategori sistem, dipakai kode dan tidak boleh dipilih manual. */
export const KATEGORI_IURAN = "Iuran warga";
export const KATEGORI_KOREKSI = "Koreksi";

export const KATEGORI_BAWAAN = {
  MASUK: [KATEGORI_IURAN, "Donasi", "Lain-lain", KATEGORI_KOREKSI],
  KELUAR: ["Kebersihan", "Keamanan", "Sosial", "Perbaikan fasilitas", "Operasional", "Lain-lain", KATEGORI_KOREKSI],
} as const;

/** Memastikan satu kategori ada, lalu mengembalikan ID-nya. Aman dipanggil berulang. */
export async function kategoriWajib(
  tx: Prisma.TransactionClient,
  nama: string,
  jenis: "MASUK" | "KELUAR",
): Promise<string> {
  const k = await tx.kategoriKas.upsert({
    where: { nama_jenis: { nama, jenis } },
    create: { nama, jenis },
    update: {},
    select: { id: true },
  });
  return k.id;
}

/** Menyiapkan kategori bawaan. Dipanggil saat halaman kas dibuka. */
export async function siapkanKategoriBawaan(tx: Prisma.TransactionClient): Promise<void> {
  for (const jenis of ["MASUK", "KELUAR"] as const) {
    for (const nama of KATEGORI_BAWAAN[jenis]) await kategoriWajib(tx, nama, jenis);
  }
}

/** Kategori yang boleh dipilih manual: bukan kategori sistem. */
export const kategoriManual = (nama: string) => nama !== KATEGORI_KOREKSI && nama !== KATEGORI_IURAN;
