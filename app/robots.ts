import type { MetadataRoute } from "next";
import { absoluteUrl, isLive } from "@/lib/seo";

/**
 * Dirender per permintaan, bukan disiapkan saat build.
 *
 * Tanpa ini Next memperlakukan robots.js sebagai Route Handler yang di-cache:
 * isinya dipanggang sekali saat `next build` — ketika SITE_IS_LIVE belum
 * ada di mesin pembangun image — lalu file "Disallow: /" itu disajikan
 * selamanya, betapapun benar env di pod. Membaca env saat berjalan tidak ada
 * gunanya kalau hasilnya sudah dibekukan lebih dulu.
 */
export const dynamic = "force-dynamic";

/**
 * Selama SITE_IS_LIVE belum "true", seluruh perayapan ditolak.
 * Ini pengaman untuk deploy preview dan staging: begitu versi sementara
 * terindeks, ia bersaing sebagai konten duplikat dengan halaman asli.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isLive) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
