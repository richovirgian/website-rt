import { Check, TriangleAlert } from "lucide-react";

/** Pesan hasil aksi: hijau bila berhasil, merah bila gagal. */
export function PesanAksi({
  pesan,
}: {
  pesan: { ok: boolean; teks: string } | null;
}) {
  if (!pesan) return null;
  return (
    <p
      role={pesan.ok ? "status" : "alert"}
      className={
        pesan.ok
          ? "flex items-start gap-2.5 rounded-lg border border-hijau/30 bg-hijau/10 px-3.5 py-3 text-sm text-hijau"
          : "flex items-start gap-2.5 rounded-lg border border-red-700/30 bg-red-50 px-3.5 py-3 text-sm text-red-800"
      }
    >
      {pesan.ok ? (
        <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      {pesan.teks}
    </p>
  );
}
