import { formatRupiah } from "@/lib/uang";

/**
 * Grafik batang pemasukan dan pengeluaran per bulan, dari div biasa (tanpa
 * pustaka grafik). Lebar batang relatif terhadap nilai terbesar. Angka
 * selalu tertulis di samping batang, jadi grafik tidak bergantung pada warna.
 */
export function BatangBulanan({
  data,
  labelBulan,
}: {
  data: { bulan: string; masuk: number; keluar: number }[];
  labelBulan: (b: string) => string;
}) {
  const maks = Math.max(1, ...data.flatMap((d) => [d.masuk, d.keluar]));
  return (
    <ul aria-label="Pemasukan dan pengeluaran per bulan" className="flex flex-col gap-4">
      {data.map((d) => (
        <li key={d.bulan}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-hijau-tua">{labelBulan(d.bulan)}</span>
            <span className="text-muted-fg">Selisih {formatRupiah(d.masuk - d.keluar)}</span>
          </div>
          {([
            ["Masuk", d.masuk, "bg-hijau"],
            ["Keluar", d.keluar, "bg-jingga"],
          ] as const).map(([nama, nilai, warna]) => (
            <div key={nama} className="mt-1.5 flex items-center gap-3">
              <span className="w-12 shrink-0 text-xs text-muted-fg">{nama}</span>
              <div className="h-3 flex-1 rounded-full bg-krem-2">
                <div className={`h-full rounded-full ${warna}`} style={{ width: `${Math.max(nilai > 0 ? 2 : 0, (nilai / maks) * 100)}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-xs font-semibold tabular-nums text-hijau-tua">{formatRupiah(nilai)}</span>
            </div>
          ))}
        </li>
      ))}
    </ul>
  );
}
