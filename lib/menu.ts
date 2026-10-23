import type { Izin } from "@/lib/izin";

/**
 * Menu panel, dikelompokkan per INDUK.
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
export type KunciGrup = "UTAMA" | "KEPENDUDUKAN" | "PEMBAYARAN" | "LAYANAN" | "SITUS" | "PENGELOLAAN";

/** Urutan induk. `label` null berarti butirnya tampil langsung tanpa induk. */
export const GRUP_MENU: readonly { kunci: KunciGrup; label: string | null; ikon: string }[] = [
  { kunci: "UTAMA", label: null, ikon: "Home" },
  { kunci: "KEPENDUDUKAN", label: "Kependudukan", ikon: "Users" },
  { kunci: "PEMBAYARAN", label: "Pembayaran", ikon: "HandCoins" },
  { kunci: "LAYANAN", label: "Layanan warga", ikon: "FileText" },
  { kunci: "SITUS", label: "Situs publik", ikon: "Globe" },
  { kunci: "PENGELOLAAN", label: "Pengelolaan", ikon: "Settings" },
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
  { href: "/admin/pengumuman", label: "Pengumuman", ikon: "Megaphone", izin: null, grup: "UTAMA", bawah: 5 },
  { href: "/admin/kegiatan", label: "Kegiatan", ikon: "CalendarDays", izin: null, grup: "UTAMA" },

  // Kependudukan
  { href: "/admin/rumah", label: "Rumah", ikon: "House", izin: "residents.read", grup: "KEPENDUDUKAN" },
  { href: "/admin/warga", label: "Warga", ikon: "Users", izin: "residents.read", grup: "KEPENDUDUKAN", bawah: 4 },
  { href: "/admin/profil", label: "Profil dan rumah", ikon: "UserRound", izin: "residents.read.own", grup: "KEPENDUDUKAN" },

  // Pembayaran
  { href: "/admin/iuran", label: "Iuran", ikon: "Coins", izin: "dues.manage", grup: "PEMBAYARAN" },
  { href: "/admin/tagihan", label: "Tagihan", ikon: "ReceiptText", izin: "bills.read", grup: "PEMBAYARAN", bawah: 1 },
  { href: "/admin/tagihan-saya", label: "Tagihan saya", ikon: "ReceiptText", izin: "bills.read.own", grup: "PEMBAYARAN", bawah: 1 },
  { href: "/admin/pembayaran", label: "Pembayaran", ikon: "HandCoins", izin: "payments.read", grup: "PEMBAYARAN", bawah: 2 },
  { href: "/admin/kas", label: "Kas", ikon: "Wallet", izin: "finance.read", grup: "PEMBAYARAN", bawah: 3 },

  // Layanan warga
  { href: "/admin/surat", label: "Surat saya", ikon: "FileText", izin: "letters.request.own", grup: "LAYANAN", bawah: 3 },
  { href: "/admin/surat", label: "Pengajuan surat", ikon: "FileText", izin: "letters.read", grup: "LAYANAN" },
  { href: "/admin/pengaduan", label: "Pengaduan saya", ikon: "MessageSquareWarning", izin: "complaints.create.own", grup: "LAYANAN" },
  { href: "/admin/pengaduan", label: "Pengaduan", ikon: "MessageSquareWarning", izin: "complaints.read", grup: "LAYANAN" },

  // Situs publik
  { href: "/admin/situs/artikel", label: "Artikel", ikon: "Newspaper", izin: "content.manage", grup: "SITUS" },
  { href: "/admin/situs/galeri", label: "Galeri", ikon: "Images", izin: "content.manage", grup: "SITUS" },
  { href: "/admin/situs/struktur", label: "Struktur pengurus", ikon: "Network", izin: "content.manage", grup: "SITUS" },

  // Pengelolaan
  { href: "/admin/pengguna", label: "Pengguna", ikon: "UserCog", izin: "users.manage", grup: "PENGELOLAAN" },
  { href: "/admin/pengaturan", label: "Pengaturan RT", ikon: "Settings", izin: "settings.manage", grup: "PENGELOLAAN" },
  { href: "/admin/audit", label: "Audit log", ikon: "ScrollText", izin: "audit.read", grup: "PENGELOLAAN" },
];

/** Mengelompokkan butir menu (yang sudah disaring peran) menurut GRUP_MENU. */
export function kelompokkan<T extends { grup: KunciGrup }>(butir: readonly T[]) {
  return GRUP_MENU.map((g) => ({ ...g, butir: butir.filter((b) => b.grup === g.kunci) })).filter((g) => g.butir.length > 0);
}
