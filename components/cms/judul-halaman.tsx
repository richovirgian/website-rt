/** Kepala halaman panel: judul, keterangan, dan tombol aksi di kanan. */
export function JudulHalaman({
  judul,
  keterangan,
  aksi,
}: {
  judul: string;
  keterangan?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-hijau sm:text-3xl">
          {judul}
        </h1>
        {keterangan && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-fg">
            {keterangan}
          </p>
        )}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2.5">{aksi}</div>}
    </div>
  );
}
