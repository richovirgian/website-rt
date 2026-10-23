/**
 * Format uang dan tanggal untuk iuran dan tagihan. Semua tanggal dihitung
 * dalam zona waktu Asia/Jakarta, bukan zona server: server Vercel berjalan
 * di UTC, dan di antara pukul 17.00 dan 24.00 WIB "hari ini" berbeda antara
 * keduanya, sehingga tagihan bisa tampak terlambat sehari lebih cepat.
 */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** Menerima number atau Decimal Prisma. */
export const formatRupiah = (n: number | { toNumber(): number }): string =>
  rupiah.format(typeof n === "number" ? n : n.toNumber());

/** Tanggal hari ini di Jakarta sebagai "YYYY-MM-DD". */
export function hariIni(sekarang: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(sekarang);
}

/** "2026-11-08" menjadi Date pada tengah malam UTC, bentuk yang dipakai kolom @db.Date. */
export const tanggalUtc = (iso: string): Date => new Date(`${iso}T00:00:00Z`);

export const isoDari = (d: Date): string => d.toISOString().slice(0, 10);

export const periodeSekarang = (sekarang: Date = new Date()): string =>
  hariIni(sekarang).slice(0, 7);

const BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** "2026-11" menjadi "November 2026"; "2026" menjadi "Tahun 2026". */
export function labelPeriode(periode: string): string {
  if (periode === "SEKALI") return "Sekali";
  const m = periode.match(/^(\d{4})-(\d{2})$/);
  if (m) return `${BULAN[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
  if (/^\d{4}$/.test(periode)) return `Tahun ${periode}`;
  return periode;
}

/** Jatuh tempo bulanan: tanggal `hari` pada bulan `periode`. */
export const jatuhTempoBulanan = (periode: string, hari: number): string =>
  `${periode}-${String(hari).padStart(2, "0")}`;

export const FORMAT_PERIODE = {
  BULANAN: /^\d{4}-(0[1-9]|1[0-2])$/,
  TAHUNAN: /^\d{4}$/,
  SEKALI: /^SEKALI$/,
} as const;
