import { cn } from "@/lib/utils";

export type Kolom<T> = {
  judul: string;
  sel: (baris: T) => React.ReactNode;
  /** Rata kanan (untuk angka). */
  kanan?: boolean;
  /** Menjadi judul kartu di ponsel. Tepat satu kolom disarankan. */
  utama?: boolean;
  /** Tidak ditampilkan di kartu ponsel. */
  sembunyiDiPonsel?: boolean;
};

/**
 * Daftar data yang tampil sebagai TABEL di layar lebar dan sebagai KARTU di
 * ponsel. Tabel lebar yang digulir ke samping sulit dipakai dengan satu
 * tangan; kartu menampilkan isi yang sama tanpa gulir mendatar.
 *
 * Komponen server: `sel` dan `aksi` berupa fungsi dari halaman server.
 */
export function DaftarResponsif<T>({
  baris,
  kolom,
  kunci,
  aksi,
  label,
}: {
  baris: T[];
  kolom: Kolom<T>[];
  kunci: (b: T) => string;
  /** Tombol per baris. Tampil di kolom terakhir tabel dan di dasar kartu. */
  aksi?: (b: T) => React.ReactNode;
  label: string;
}) {
  const utama = kolom.find((k) => k.utama) ?? kolom[0]!;
  const lain = kolom.filter((k) => k !== utama && !k.sembunyiDiPonsel);

  return (
    <>
      {/* Ponsel: kartu */}
      <ul aria-label={label} className="flex flex-col gap-3 md:hidden">
        {baris.map((b) => {
          const a = aksi?.(b);
          return (
            <li key={kunci(b)} className="rounded-2xl border border-line bg-surface p-4">
              <div className="font-semibold text-hijau">{utama.sel(b)}</div>
              <dl className="mt-2.5 flex flex-col gap-1.5 text-sm">
                {lain.map((k) => (
                  <div key={k.judul} className="flex items-baseline justify-between gap-4">
                    <dt className="shrink-0 text-muted-fg">{k.judul}</dt>
                    <dd className="min-w-0 text-right text-hijau-tua">{k.sel(b)}</dd>
                  </div>
                ))}
              </dl>
              {a && <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">{a}</div>}
            </li>
          );
        })}
      </ul>

      {/* Layar lebar: tabel */}
      <div className="hidden overflow-x-auto rounded-2xl border border-line bg-surface md:block">
        <table aria-label={label} className="w-full text-left text-sm">
          <thead className="bg-krem-2 text-xs uppercase tracking-wider text-muted-fg">
            <tr>
              {kolom.map((k) => (
                <th key={k.judul} scope="col" className={cn("px-4 py-3", k.kanan && "text-right")}>
                  {k.judul}
                </th>
              ))}
              {aksi && (
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Aksi</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line align-top">
            {baris.map((b) => (
              <tr key={kunci(b)} className="hover:bg-krem-2/50">
                {kolom.map((k) => (
                  <td key={k.judul} className={cn("px-4 py-3", k.kanan && "text-right")}>
                    {k.sel(b)}
                  </td>
                ))}
                {aksi && <td className="px-4 py-3">{aksi(b)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
