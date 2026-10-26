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
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-hijau-tua sm:text-[34px]">
          {judul}
        </h1>
        {keterangan && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-fg">
            {keterangan}
          </p>
        )}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2.5">{aksi}</div>}
    </div>
  );
}
