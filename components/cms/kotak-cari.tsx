import { Search } from "lucide-react";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Formulir pencarian GET. Server membaca `q` (dan `status`) dari searchParams. */
export function KotakCari({
  placeholder,
  q,
  status,
  pilihanStatus,
}: {
  placeholder: string;
  q?: string;
  status?: string;
  pilihanStatus?: { nilai: string; label: string }[];
}) {
  return (
    <form method="get" role="search" className="mb-5 flex flex-wrap gap-2.5">
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg"
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`${KELAS_ISIAN} pl-9`}
        />
      </div>
      {pilihanStatus && (
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Saring status"
          className={`${KELAS_ISIAN} w-auto`}
        >
          <option value="">Semua status</option>
          {pilihanStatus.map((p) => (
            <option key={p.nilai} value={p.nilai}>
              {p.label}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className={TOMBOL_UTAMA}>
        Cari
      </button>
    </form>
  );
}
