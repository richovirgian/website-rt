/**
 * Hasil standar sebuah server action.
 *
 * `galat` memetakan nama isian ke pesan, supaya formulir bisa menandai isian
 * yang bermasalah. `pesan` untuk ringkasan yang tampil di atas formulir.
 */
export type HasilAksi =
  | { ok: true; id?: string }
  | { ok: false; pesan: string; galat?: Record<string, string> };

/** Mengubah galat Zod menjadi HasilAksi gagal. */
export function galatDariZod(error: {
  issues: ReadonlyArray<{ path: PropertyKey[]; message: string }>;
}): Extract<HasilAksi, { ok: false }> {
  const galat: Record<string, string> = {};
  for (const m of error.issues) {
    const kunci = m.path.map(String).join(".") || "form";
    galat[kunci] ??= m.message;
  }
  return { ok: false, pesan: "Ada isian yang belum benar.", galat };
}
