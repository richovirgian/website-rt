import type { Izin } from "@/lib/izin";

/**
 * Menu panel. Hanya halaman yang sudah ada yang boleh masuk daftar ini: menu
 * yang mengarah ke halaman kosong adalah tombol dekoratif. Tambahkan butir
 * baru bersamaan dengan halamannya, pada tahap modul itu dikerjakan.
 *
 * `izin` null berarti semua pengguna yang sudah masuk. Menyaring menu hanya
 * kenyamanan; penjaga sebenarnya ada di halaman dan aksi servernya.
 */
export type ButirMenu = {
  href: string;
  label: string;
  ikon: string;
  izin: Izin | null;
};

export const MENU: readonly ButirMenu[] = [
  { href: "/admin", label: "Ringkasan", ikon: "Home", izin: null },
  { href: "/admin/rumah", label: "Rumah", ikon: "House", izin: "residents.read" },
  { href: "/admin/warga", label: "Warga", ikon: "Users", izin: "residents.read" },
  { href: "/admin/profil", label: "Profil dan rumah", ikon: "UserRound", izin: "residents.read.own" },
  { href: "/admin/pengguna", label: "Pengguna", ikon: "UserCog", izin: "users.manage" },
  { href: "/admin/pengaturan", label: "Pengaturan RT", ikon: "Settings", izin: "settings.manage" },
  { href: "/admin/audit", label: "Audit log", ikon: "ScrollText", izin: "audit.read" },
];
