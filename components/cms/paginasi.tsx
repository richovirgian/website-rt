import Link from "next/link";

/** Penomoran halaman berbasis query string. Parameter lain ikut dipertahankan. */
export function Paginasi({
  jalur,
  halaman,
  total,
  perHalaman,
  params = {},
}: {
  jalur: string;
  halaman: number;
  total: number;
  perHalaman: number;
  params?: Record<string, string | undefined>;
}) {
  const jumlah = Math.max(1, Math.ceil(total / perHalaman));
  if (jumlah <= 1) {
    return <p className="mt-4 text-sm text-muted-fg">{total} data</p>;
  }
  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    p.set("halaman", String(n));
    return `${jalur}?${p.toString()}`;
  };
  const tautan = "rounded-lg border border-line-strong bg-surface px-3.5 py-2 text-sm font-semibold text-hijau hover:bg-krem-2";
  return (
    <nav aria-label="Halaman" className="mt-4 flex flex-wrap items-center gap-3 text-sm">
      {halaman > 1 && (
        <Link className={tautan} href={href(halaman - 1)}>
          Sebelumnya
        </Link>
      )}
      <span className="text-muted-fg">
        Halaman {halaman} dari {jumlah} · {total} data
      </span>
      {halaman < jumlah && (
        <Link className={tautan} href={href(halaman + 1)}>
          Berikutnya
        </Link>
      )}
    </nav>
  );
}
