"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, EyeOff } from "lucide-react";
import { tampilkanNik } from "@/lib/cms/aksi-warga";
import { samarkanNik } from "@/lib/enkripsi-tampil";

/**
 * Menampilkan NIK tersamar, dengan tombol untuk membukanya. Membuka NIK
 * memanggil server dan tercatat di audit log. NIK utuh disembunyikan lagi
 * otomatis setelah 20 detik.
 */
export function TombolNik({
  wargaId,
  akhir4,
}: {
  wargaId: string;
  akhir4: string | null;
}) {
  const [nik, setNik] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [proses, mulai] = useTransition();

  useEffect(() => {
    if (!nik) return;
    const t = setTimeout(() => setNik(null), 20_000);
    return () => clearTimeout(t);
  }, [nik]);

  if (!akhir4) return <span className="text-muted-fg">Belum diisi</span>;

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <span className="font-mono tracking-wider">{nik ?? samarkanNik(akhir4)}</span>
      <button
        type="button"
        disabled={proses}
        onClick={() => {
          if (nik) return setNik(null);
          setGalat(null);
          mulai(async () => {
            const h = await tampilkanNik(wargaId);
            if (h.ok) setNik(h.nik);
            else setGalat(h.pesan);
          });
        }}
        className="inline-flex items-center gap-1.5 rounded-md border border-line-strong px-2.5 py-1 text-xs font-semibold text-hijau hover:bg-krem-2 disabled:opacity-60"
      >
        {nik ? <EyeOff className="size-3.5" aria-hidden="true" /> : <Eye className="size-3.5" aria-hidden="true" />}
        {nik ? "Sembunyikan" : proses ? "Membuka..." : "Tampilkan"}
      </button>
      {galat && <span role="alert" className="text-xs text-red-700">{galat}</span>}
    </span>
  );
}
