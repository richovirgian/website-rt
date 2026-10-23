"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { batalkanTagihan } from "@/lib/cms/aksi-tagihan";
import { useAksi } from "@/components/cms/use-aksi";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_BAHAYA } from "@/components/cms/gaya";

/**
 * Pembatalan tagihan dengan alasan wajib. Tampil sebagai panel kecil di
 * dalam baris, bukan dialog, karena alasan harus diketik.
 */
export function TombolBatalkan({ id, judul }: { id: string; judul: string }) {
  const [alasan, setAlasan] = useState("");
  const { proses, galat, pesan, jalankan } = useAksi();

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-semibold text-red-700 underline-offset-4 hover:underline marker:hidden [&::-webkit-details-marker]:hidden">
        Batalkan
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          jalankan(() => batalkanTagihan(id, { alasan }), { berhasil: "Tagihan dibatalkan." });
        }}
        className="mt-3 flex w-64 flex-col gap-2"
      >
        <label htmlFor={`alasan-${id}`} className="text-xs font-medium text-hijau-tua">
          Alasan membatalkan “{judul}”
        </label>
        <input id={`alasan-${id}`} value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={300} required minLength={5} className={KELAS_ISIAN} aria-invalid={galat.alasan ? true : undefined} />
        {galat.alasan && <p role="alert" className="text-xs text-red-700">{galat.alasan}</p>}
        <PesanAksi pesan={pesan && !pesan.ok ? pesan : null} />
        <button type="submit" disabled={proses} className={TOMBOL_BAHAYA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Membatalkan..." : "Ya, batalkan tagihan"}
        </button>
      </form>
    </details>
  );
}
