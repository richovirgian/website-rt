import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma";

/**
 * Koneksi database, dibuat saat pertama kali dipakai.
 *
 * Sengaja TIDAK dibuat saat modul diimpor. `next build` mengumpulkan data
 * halaman dengan mengimpor setiap route, dan di dalam container tidak ada
 * DATABASE_URL: kalau koneksinya dibangun di tingkat modul, build gagal
 * padahal tidak ada satu pun kueri yang dijalankan.
 *
 * Penjaganya tetap ada, hanya berpindah ke saat pemakaian. Gagal keras di situ
 * masih benar: formulir yang tampak berhasil padahal tidak menyimpan apa pun
 * persis masalah yang tabel ini dibuat untuk menyelesaikannya.
 *
 * Prisma 7 tidak lagi menerima URL dari berkas skema. Ia masuk lewat driver
 * adapter di sini, sementara CLI dan Migrate membacanya dari prisma.config.ts.
 */

// Next.js membuat modul ini berkali-kali saat pengembangan. Tanpa disimpan di
// globalThis, setiap perubahan berkas membuka kumpulan koneksi baru sampai
// Postgres menolak.
const g = globalThis as unknown as { __db?: PrismaClient };

export function db(): PrismaClient {
  if (g.__db) return g.__db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diisi. Salin .env.example menjadi .env.local lalu isi.",
    );
  }

  const klien = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  // Di produksi pun disimpan: satu instance per proses, bukan per permintaan.
  g.__db = klien;
  return klien;
}
