/**
 * Tab navigasi situs publik. Sengaja di modul tanpa "use client": footer
 * (komponen server) dan navbar (komponen klien) sama-sama memakainya, dan
 * konstanta yang diekspor dari modul klien tidak bisa dibaca server.
 */
export const TAB_SITUS = [
  { href: "/", label: "Beranda" },
  { href: "/profil", label: "Profil" },
  { href: "/struktur", label: "Struktur" },
  { href: "/kegiatan", label: "Kegiatan" },
  { href: "/artikel", label: "Artikel" },
  { href: "/galeri", label: "Galeri" },
  { href: "/kontak", label: "Kontak" },
] as const;
