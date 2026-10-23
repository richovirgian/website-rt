import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { isLive, siteUrl } from "@/lib/seo";
import { pengaturanRt } from "@/lib/pengaturan";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * `viewportFit: cover` membiarkan halaman memakai seluruh layar ponsel
 * berponi; bilah navigasi bawah menambah padding area aman sendiri.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f5f4a",
};

export async function generateMetadata(): Promise<Metadata> {
  const rt = await pengaturanRt();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: rt.namaRt, template: `%s | ${rt.namaRt}` },
    applicationName: rt.namaRt,
    appleWebApp: { capable: true, title: rt.namaRt, statusBarStyle: "default" },
    description: `Portal warga ${rt.namaRt}: iuran, surat pengantar, pengumuman, dan pengaduan.`,
    robots: isLive
      ? { index: true, follow: true }
      : { index: false, follow: false, nocache: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={cn("h-full", inter.variable)}>
      <body className="flex min-h-full flex-col antialiased">{children}</body>
    </html>
  );
}
