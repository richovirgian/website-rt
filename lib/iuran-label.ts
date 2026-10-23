export const FREKUENSI = ["BULANAN", "TAHUNAN", "SEKALI"] as const;
export type Frekuensi = (typeof FREKUENSI)[number];

export const LABEL_FREKUENSI: Record<Frekuensi, string> = {
  BULANAN: "Bulanan",
  TAHUNAN: "Tahunan",
  SEKALI: "Sekali (insidental)",
};

export const STATUS_TAGIHAN = ["UNPAID", "PAID", "CANCELLED"] as const;
export type StatusTagihan = (typeof STATUS_TAGIHAN)[number];

export const LABEL_STATUS: Record<StatusTagihan | "TERLAMBAT", string> = {
  UNPAID: "Belum dibayar",
  PAID: "Lunas",
  CANCELLED: "Dibatalkan",
  TERLAMBAT: "Terlambat",
};
