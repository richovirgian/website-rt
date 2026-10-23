/**
 * Domain situs dan saklar live, dibaca dari env saat proses server berjalan.
 *
 *   DOMAIN_SITE_URL   https://rt-contoh.example
 *   SITE_IS_LIVE      "true" hanya di produksi
 *
 * Keduanya SENGAJA tanpa awalan NEXT_PUBLIC_. Next membekukan setiap
 * NEXT_PUBLIC_* menjadi nilai literal saat `next build`, sehingga mengisi env
 * di server setelah build tidak berpengaruh. Tanpa awalan itu, nilainya dibaca
 * saat proses berjalan, dan satu hasil build bisa dipakai lintas lingkungan.
 *
 * Berkas ini hanya diimpor komponen server.
 */
const rawSiteUrl = process.env.DOMAIN_SITE_URL?.trim();

/**
 * Situs hanya boleh diindeks bila dinyatakan live secara eksplisit. Default-nya
 * tertutup supaya deploy preview atau staging tidak masuk mesin telusur.
 */
export const isLive = process.env.SITE_IS_LIVE === "true";

// Live tanpa domain membuat setiap tautan absolut menunjuk ke localhost.
// Lebih baik gagal keras saat boot daripada terbit dengan tautan yang salah.
if (isLive && !rawSiteUrl) {
  throw new Error(
    "SITE_IS_LIVE=true tetapi DOMAIN_SITE_URL kosong. " +
      "Isi domainnya, atau matikan SITE_IS_LIVE.",
  );
}

export const siteUrl = (rawSiteUrl ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

/** URL absolut untuk metadata, robots, dan tautan di notifikasi. */
export const absoluteUrl = (path = "/") =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
