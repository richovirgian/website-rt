import { hariIni } from "@/lib/uang";
import type { StatusTagihan } from "@/lib/iuran-label";

/** Status yang ditampilkan: UNPAID yang lewat jatuh tempo tampil sebagai Terlambat. */
export function statusTampil(
  status: StatusTagihan,
  jatuhTempo: Date,
  hari: string = hariIni(),
): StatusTagihan | "TERLAMBAT" {
  return status === "UNPAID" && jatuhTempo.toISOString().slice(0, 10) < hari
    ? "TERLAMBAT"
    : status;
}

export const NADA_STATUS = {
  UNPAID: "jingga",
  PAID: "hijau",
  CANCELLED: "abu",
  TERLAMBAT: "merah",
} as const;
