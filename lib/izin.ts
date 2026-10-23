/**
 * Matriks role dan izin. Satu-satunya tempat yang menyatakan siapa boleh apa.
 *
 * Izin ditulis "sumber.tindakan". Daftar lengkap dibuat sejak Tahap 0 supaya
 * rancangannya bisa ditinjau sekarang, tetapi izin untuk modul yang belum
 * dibangun belum dipakai di mana pun. Dokumen pendampingnya:
 * docs/role-permission-matrix.md. Ubah keduanya bersamaan.
 *
 * Izin ini menjawab "boleh melakukan jenis tindakan ini". Untuk Warga, izin
 * saja tidak cukup: tindakan juga harus dibatasi ke data milik rumah
 * tangganya sendiri (cek relasi di kueri, bukan hanya role). Izin berakhiran
 * `.own` menandai itu.
 */

export const PERAN = ["admin", "bendahara", "warga"] as const;
export type Peran = (typeof PERAN)[number];

export const IZIN = [
  // Pengguna dan pengaturan
  "users.manage",
  "settings.manage",
  "audit.read",

  // Warga dan rumah
  "residents.read",
  "residents.create",
  "residents.update",
  "residents.read_identity",
  "residents.export",
  "residents.read.own",

  // Iuran dan tagihan
  "dues.manage",
  "bills.read",
  "bills.create",
  "bills.cancel",
  "bills.read.own",

  // Pembayaran
  "payments.record_cash",
  "payments.verify",
  "payments.read",
  "payments.create.own",
  "payments.read.own",

  // Kas
  "finance.read",
  "finance.create",
  "finance.reverse",
  "receipts.read.own",

  // Surat
  "letters.request.own",
  "letters.approve",
  "letters.read",

  // Pengumuman, pengaduan, kegiatan
  "announcements.manage",
  "complaints.create.own",
  "complaints.assign",
  "complaints.read",
  "events.manage",

  // Laporan
  "reports.read",
  "reports.export",
] as const;
export type Izin = (typeof IZIN)[number];

const ADMIN: readonly Izin[] = [
  "users.manage",
  "settings.manage",
  "audit.read",
  "residents.read",
  "residents.create",
  "residents.update",
  "residents.read_identity",
  "residents.export",
  "dues.manage",
  "bills.read",
  "bills.create",
  "bills.cancel",
  "payments.read",
  "finance.read",
  "letters.approve",
  "letters.read",
  "announcements.manage",
  "complaints.assign",
  "complaints.read",
  "events.manage",
  "reports.read",
  "reports.export",
];

const BENDAHARA: readonly Izin[] = [
  "residents.read",
  "dues.manage",
  "bills.read",
  "bills.create",
  "bills.cancel",
  "payments.record_cash",
  "payments.verify",
  "payments.read",
  "finance.read",
  "finance.create",
  "finance.reverse",
  "reports.read",
  "reports.export",
];

const WARGA: readonly Izin[] = [
  "residents.read.own",
  "bills.read.own",
  "payments.create.own",
  "payments.read.own",
  "receipts.read.own",
  "letters.request.own",
  "complaints.create.own",
];

/**
 * Admin sengaja TIDAK punya `finance.create`, `payments.verify`, dan
 * `payments.record_cash`: memisahkan yang mengelola dari yang memegang uang.
 * Kalau satu orang merangkap keduanya (RT kecil sering begitu), beri akunnya
 * role bendahara atau buat dua akun. Jangan melonggarkan matriks ini.
 */
export const MATRIKS: Record<Peran, ReadonlySet<Izin>> = {
  admin: new Set(ADMIN),
  bendahara: new Set(BENDAHARA),
  warga: new Set(WARGA),
};

export const punya = (peran: Peran, izin: Izin): boolean =>
  MATRIKS[peran].has(izin);

export const punyaSalahSatu = (
  peran: Peran,
  daftar: readonly Izin[],
): boolean => daftar.some((i) => punya(peran, i));

/** Normalisasi nilai `User.role`. Nilai tak dikenal jatuh ke peran terendah. */
export function peranDari(nilai: string | null | undefined): Peran {
  const r = nilai?.toLowerCase();
  return (PERAN as readonly string[]).includes(r ?? "")
    ? (r as Peran)
    : "warga";
}

export const INFO_PERAN: Record<
  Peran,
  { nama: string; deskripsi: string; kelas: string }
> = {
  admin: {
    nama: "Admin (Ketua RT)",
    deskripsi:
      "Mengelola pengguna, pengaturan, data warga, tagihan, pengumuman, surat, dan pengaduan. Tidak memegang uang.",
    kelas: "border-hijau/30 bg-hijau/10 text-hijau",
  },
  bendahara: {
    nama: "Bendahara",
    deskripsi:
      "Mengelola jenis iuran, tagihan, pembayaran, verifikasi transfer, dan kas. Koreksi transaksi lewat reversal.",
    kelas: "border-amber-500/30 bg-amber-500/10 text-amber-800",
  },
  warga: {
    nama: "Warga",
    deskripsi:
      "Melihat data dan tagihan rumah tangganya sendiri, membayar, mengajukan surat, dan menyampaikan pengaduan.",
    kelas: "border-blue-500/30 bg-blue-500/10 text-blue-800",
  },
};
