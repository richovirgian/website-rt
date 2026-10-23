import { Info } from "lucide-react";

/** Pemberitahuan bahwa situs publik masih memakai isi bawaan, bukan isi dari panel. */
export function BannerBawaan({ children }: { children: React.ReactNode }) {
  return (
    <p role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-700/30 bg-jingga/10 p-4 text-sm leading-relaxed text-hijau-tua">
      <Info className="mt-0.5 size-4 shrink-0 text-amber-800" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
