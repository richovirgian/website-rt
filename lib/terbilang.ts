/** Mengeja bilangan bulat dalam bahasa Indonesia, untuk kuitansi. Mendukung sampai triliunan. */
const SATUAN = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan", "sepuluh", "sebelas"];

function eja(n: number): string {
  if (n < 12) return SATUAN[n]!;
  if (n < 20) return `${eja(n - 10)} belas`;
  if (n < 100) return `${eja(Math.floor(n / 10))} puluh${n % 10 ? ` ${eja(n % 10)}` : ""}`;
  if (n < 200) return `seratus${n - 100 ? ` ${eja(n - 100)}` : ""}`;
  if (n < 1000) return `${eja(Math.floor(n / 100))} ratus${n % 100 ? ` ${eja(n % 100)}` : ""}`;
  if (n < 2000) return `seribu${n - 1000 ? ` ${eja(n - 1000)}` : ""}`;
  if (n < 1_000_000) return `${eja(Math.floor(n / 1000))} ribu${n % 1000 ? ` ${eja(n % 1000)}` : ""}`;
  if (n < 1_000_000_000) return `${eja(Math.floor(n / 1_000_000))} juta${n % 1_000_000 ? ` ${eja(n % 1_000_000)}` : ""}`;
  if (n < 1_000_000_000_000) return `${eja(Math.floor(n / 1_000_000_000))} miliar${n % 1_000_000_000 ? ` ${eja(n % 1_000_000_000)}` : ""}`;
  return `${eja(Math.floor(n / 1_000_000_000_000))} triliun${n % 1_000_000_000_000 ? ` ${eja(n % 1_000_000_000_000)}` : ""}`;
}

export function terbilangRupiah(n: number): string {
  const bulat = Math.floor(Math.abs(n));
  const teks = bulat === 0 ? "nol" : eja(bulat);
  return `${teks.charAt(0).toUpperCase()}${teks.slice(1)} rupiah`;
}
