/**
 * Galat yang pesannya aman ditampilkan ke pengguna. Dilempar di dalam
 * transaksi untuk membatalkan seluruh penulisan, lalu ditangkap oleh aksi.
 * Berada di modul biasa (bukan berkas "use server") supaya kelasnya boleh
 * diekspor.
 */
export class GalatBisnis extends Error {}

export function ubahGalat(e: unknown, cadangan: string, label: string): { ok: false; pesan: string } {
  if (e instanceof GalatBisnis) return { ok: false, pesan: e.message };
  console.error(`[${label}]`, cadangan, e);
  return { ok: false, pesan: cadangan };
}
