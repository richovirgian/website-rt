"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { catatTunai } from "@/lib/cms/aksi-pembayaran";
import { hariIni } from "@/lib/uang";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Bendahara mencatat pembayaran tunai. Langsung lunas, tercatat di kas, dan menerbitkan kuitansi. */
export function TombolTunai({ id, judul, nominal }: { id: string; judul: string; nominal: string }) {
  const [n, setN] = useState({ tanggalBayar: hariIni(), dibayarOleh: "", catatan: "" });
  const { proses, galat, pesan, jalankan } = useAksi();

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-semibold text-hijau underline-offset-4 hover:underline marker:hidden [&::-webkit-details-marker]:hidden">
        Catat tunai
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          jalankan(() => catatTunai(id, n), { berhasil: "Pembayaran tunai dicatat." });
        }}
        className="mt-3 flex w-full max-w-72 flex-col gap-2"
      >
        <p className="text-xs text-muted-fg">
          {judul} · <strong className="text-hijau-tua">{nominal}</strong>
        </p>
        <Bidang id={`tgl-${id}`} label="Tanggal terima" wajib galat={galat.tanggalBayar}>
          <input id={`tgl-${id}`} type="date" value={n.tanggalBayar} max={hariIni()} onChange={(e) => setN((s) => ({ ...s, tanggalBayar: e.target.value }))} required className={KELAS_ISIAN} aria-describedby={`tgl-${id}-info`} />
        </Bidang>
        <Bidang id={`oleh-${id}`} label="Nama pembayar" galat={galat.dibayarOleh}>
          <input id={`oleh-${id}`} value={n.dibayarOleh} onChange={(e) => setN((s) => ({ ...s, dibayarOleh: e.target.value }))} maxLength={100} className={KELAS_ISIAN} aria-describedby={`oleh-${id}-info`} />
        </Bidang>
        <PesanAksi pesan={pesan} />
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : "Catat sebagai lunas"}
        </button>
      </form>
    </details>
  );
}
