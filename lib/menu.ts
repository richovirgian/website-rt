import type { Izin } from "@/lib/izin";

/**
 * Menu panel, dikelompokkan per bagian (Data, Keuangan, Komunitas, dst.).
 *
 * Susunan induk dan isinya ada di sini saja: ubah `grup` pada tiap butir
 * untuk memindahkannya, atau ubah GRUP_MENU untuk menamai atau mengurutkan
 * ulang induk. Induk tanpa butir yang boleh dilihat peran itu tidak tampil,
 * dan induk yang hanya punya satu butir tampil sebagai tautan biasa.
 *
 * Hanya halaman yang sudah ada yang boleh masuk daftar ini: menu yang
 * mengarah ke halaman kosong adalah tombol dekoratif. `izin` null berarti
 * semua pengguna yang sudah masuk. Menyaring menu hanya kenyamanan; penjaga
 * sebenarnya ada di halaman dan aksi servernya.
 */
export type KunciGrup = "UTAMA" | "KEPENDUDUKAN" | "PEMBAYARAN" | "KOMUNITAS" | "SITUS" | "PENGELOLAAN";

/** Urutan induk. `label` null berarti butirnya tampil langsung tanpa induk. */
export const GRUP_MENU: readonly { kunci: KunciGrup; label: string | null; ikon: string }[] = [
  { kunci: "UTAMA", label: null, ikon: "Home" },
  { kunci: "KEPENDUDUKAN", label: "Data", ikon: "Users" },
  { kunci: "PEMBAYARAN", label: "Keuangan", ikon: "HandCoins" },
  { kunci: "KOMUNITAS", label: "Komunitas", ikon: "Megaphone" },
  { kunci: "SITUS", label: "Situs publik", ikon: "Globe" },
  { kunci: "PENGELOLAAN", label: "Admin", ikon: "Settings" },
];

export type ButirMenu = {
  href: string;
  label: string;
  ikon: string;
  izin: Izin | null;
  grup: KunciGrup;
  /**
   * Prioritas di bilah navigasi bawah (ponsel). Angka kecil lebih dulu, dan
   * hanya empat teratas yang tampil di bilah; sisanya masuk "Lainnya".
   */
  bawah?: number;
};

export const MENU: readonly ButirMenu[] = [
  // Utama
  { href: "/admin", label: "Ringkasan", ikon: "Home", izin: null, grup: "UTAMA", bawah: 0 },

  // Data (kependudukan)
  { href: "/admin/rumah", label: "Rumah", ikon: "House", izin: "residents.read", grup: "KEPENDUDUKAN" },
  { href: "/admin/warga", label: "Warga", ikon: "Users", izin: "residents.read", grup: "KEPENDUDUKAN", bawah: 1.5 },
  { href: "/admin/profil", label: "Profil dan rumah", ikon: "UserRound", izin: "residents.read.own", grup: "KEPENDUDUKAN" },

  // Keuangan
  { href: "/admin/iuran", label: "Iuran", ikon: "Coins", izin: "dues.manage", grup: "PEMBAYARAN" },
  { href: "/admin/tagihan", label: "Tagihan", ikon: "ReceiptText", izin: "bills.read", grup: "PEMBAYARAN", bawah: 2 },
  { href: "/admin/tagihan-saya", label: "Tagihan saya", ikon: "ReceiptText", izin: "bills.read.own", grup: "PEMBAYARAN", bawah: 1 },
  { href: "/admin/pembayaran", label: "Pembayaran", ikon: "HandCoins", izin: "payments.read", grup: "PEMBAYARAN", bawah: 3 },
  { href: "/admin/kas", label: "Kas", ikon: "Wallet", izin: "finance.read", grup: "PEMBAYARAN", bawah: 4 },

  // Komunitas
  { href: "/admin/pengumuman", label: "Pengumuman", ikon: "Megaphone", izin: null, grup: "KOMUNITAS", bawah: 5 },
  { href: "/admin/kegiatan", label: "Kegiatan", ikon: "CalendarDays", izin: null, grup: "KOMUNITAS" },
  { href: "/admin/surat", label: "Surat saya", ikon: "FileText", izin: "letters.request.own", grup: "KOMUNITAS", bawah: 3 },
  { href: "/admin/surat", label: "Pengajuan surat", ikon: "FileText", izin: "letters.read", grup: "KOMUNITAS" },
  { href: "/admin/pengaduan", label: "Pengaduan saya", ikon: "MessageSquareWarning", izin: "complaints.create.own", grup: "KOMUNITAS" },
  { href: "/admin/pengaduan", label: "Pengaduan", ikon: "MessageSquareWarning", izin: "complaints.read", grup: "KOMUNITAS" },

  // Situs publik
  { href: "/admin/situs/artikel", label: "Artikel", ikon: "Newspaper", izin: "content.manage", grup: "SITUS" },
  { href: "/admin/situs/galeri", label: "Galeri", ikon: "Images", izin: "content.manage", grup: "SITUS" },
  { href: "/admin/situs/struktur", label: "Struktur pengurus", ikon: "Network", izin: "content.manage", grup: "SITUS" },

  // Admin (pengelolaan)
  { href: "/admin/pengguna", label: "Pengguna", ikon: "UserCog", izin: "users.manage", grup: "PENGELOLAAN" },
  { href: "/admin/pengaturan", label: "Pengaturan RT", ikon: "Settings", izin: "settings.manage", grup: "PENGELOLAAN" },
  { href: "/admin/audit", label: "Audit log", ikon: "ScrollText", izin: "audit.read", grup: "PENGELOLAAN" },
];

/** Mengelompokkan butir menu (yang sudah disaring peran) menurut GRUP_MENU. */
export function kelompokkan<T extends { grup: KunciGrup }>(butir: readonly T[]) {
  return GRUP_MENU.map((g) => ({ ...g, butir: butir.filter((b) => b.grup === g.kunci) })).filter((g) => g.butir.length > 0);
}
