/**
 * Kelas bersama untuk formulir dan tombol di panel. Berupa string biasa
 * (bukan komponen) supaya bisa dipakai di komponen server maupun klien.
 */
export const KELAS_ISIAN =
  "h-11 w-full min-w-0 rounded-[10px] border border-line-strong bg-surface px-3.5 text-base text-hijau-tua sm:h-11 sm:text-[15px] outline-none transition-colors placeholder:text-muted-fg/70 focus-visible:border-hijau focus-visible:ring-2 focus-visible:ring-hijau/25 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-red-600";

const TOMBOL_DASAR =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] px-4 text-[14px] font-medium transition-colors sm:h-11 sm:px-5 sm:text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-hijau/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60";

export const TOMBOL_UTAMA = `${TOMBOL_DASAR} bg-hijau text-krem shadow-[inset_0_1px_0_rgba(255,255,255,.15),0_1px_2px_rgba(28,25,23,.2)] hover:brightness-90`;
export const TOMBOL_SEKUNDER = `${TOMBOL_DASAR} border border-line-strong bg-surface text-hijau-tua hover:bg-krem-2 hover:border-[#b9c2b5]`;
export const TOMBOL_BAHAYA = `${TOMBOL_DASAR} border border-red-700/30 bg-surface text-red-700 hover:bg-red-50`;

export const KARTU = "rounded-[14px] border border-line-strong bg-surface p-5 sm:p-6";
