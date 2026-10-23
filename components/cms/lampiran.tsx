import { FileText, Paperclip } from "lucide-react";

type Berkas = { id: string; namaBerkas: string; tipe: string; ukuran: number };

const ukuranTeks = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

/** Daftar lampiran. Tiap berkas dibuka lewat /api/lampiran/[id] yang memeriksa izin. */
export function DaftarLampiran({ berkas, judul = "Lampiran", aksi }: { berkas: Berkas[]; judul?: string; aksi?: (b: Berkas) => React.ReactNode }) {
  if (berkas.length === 0) return null;
  return (
    <section aria-label={judul} className="mt-5">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">
        <Paperclip className="size-3.5" aria-hidden="true" />
        {judul} ({berkas.length})
      </h3>
      <ul className="flex flex-col gap-2">
        {berkas.map((b) => (
          <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-2.5">
            <a href={`/api/lampiran/${b.id}`} target="_blank" rel="noopener noreferrer" className="flex min-h-9 min-w-0 items-center gap-2.5 text-sm font-semibold text-hijau underline-offset-4 hover:underline">
              <FileText className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{b.namaBerkas}</span>
              <span className="shrink-0 font-normal text-muted-fg">{ukuranTeks(b.ukuran)}</span>
            </a>
            {aksi?.(b)}
          </li>
        ))}
      </ul>
    </section>
  );
}
