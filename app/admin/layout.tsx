import type { Metadata } from "next";

/**
 * Seluruh cabang /admin dirender per permintaan.
 *
 * Tanpa ini Next mencoba menghasilkan halaman admin saat build, dan halaman itu
 * membaca sesi — sehingga build menuntut BETTER_AUTH_SECRET dan DATABASE_URL
 * yang memang tidak ada di dalam container. Panel admin juga tidak punya satu
 * pun halaman yang layak disimpan sebagai HTML statis.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Panel admin tidak boleh masuk indeks, terlepas dari SITE_IS_LIVE.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Layout paling luar /admin. Sengaja tidak memeriksa sesi: halaman masuk
 * berada di bawahnya juga, dan penjaga di sini akan membuat pengalihan
 * berputar. Penjaganya ada di layout (dashboard) satu tingkat di dalam.
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
