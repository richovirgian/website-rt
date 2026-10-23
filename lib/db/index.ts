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

/**
 * Adapter pg mengirim dan membaca waktu (timestamptz) sebagai UTC tanpa
 * zona, jadi hasilnya BENAR hanya bila zona waktu sesi database adalah UTC.
 * Pada database berzona lain (misalnya PostgreSQL lokal berzona Asia/Jakarta)
 * setiap waktu yang ditulis aplikasi tersimpan bergeser: waktu kegiatan,
 * jadwal terbit, dan perbandingan dengan now() di database ikut salah, tanpa
 * pesan galat apa pun. Supabase berzona UTC; untuk database lain jalankan
 *   ALTER DATABASE <nama> SET timezone TO 'UTC';
 * Pemeriksaan ini hanya mengeluh keras di log, tidak menghentikan aplikasi.
 */
function periksaZonaWaktu(klien: PrismaClient): void {
  klien
    .$queryRaw<{ zona: string }[]>`select current_setting('TimeZone') as zona`
    .then(([r]) => {
      if (r && !/^(utc|etc\/utc|gmt|etc\/gmt)$/i.test(r.zona)) {
        console.error(
          `[db] PERINGATAN: zona waktu database "${r.zona}", bukan UTC. Waktu yang disimpan aplikasi akan bergeser. ` +
            "Jalankan: ALTER DATABASE <nama> SET timezone TO 'UTC';",
        );
      }
    })
    .catch(() => {
      /* pemeriksaan ini tidak boleh mengganggu aplikasi */
    });
}

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

  periksaZonaWaktu(klien);

  // Di produksi pun disimpan: satu instance per proses, bukan per permintaan.
  g.__db = klien;
  return klien;
}
