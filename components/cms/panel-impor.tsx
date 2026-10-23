"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, FileUp, Loader2, TriangleAlert } from "lucide-react";
import {
  jalankanImpor,
  pratinjauImpor,
  type HasilImpor,
  type HasilPratinjau,
} from "@/lib/cms/aksi-impor";
import { TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";
import { PesanAksi } from "@/components/cms/pesan-aksi";

/**
 * Impor CSV dua langkah: pilih berkas → periksa → impor. Isi berkas disimpan
 * di peramban dan dikirim ulang saat mengimpor; server memeriksanya lagi.
 */
export function PanelImpor() {
  const [csv, setCsv] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [pratinjau, setPratinjau] = useState<HasilPratinjau | null>(null);
  const [hasil, setHasil] = useState<HasilImpor | null>(null);
  const [proses, mulai] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setHasil(null);
    setPratinjau(null);
    setNama(f.name);
    const teks = await f.text();
    setCsv(teks);
    mulai(async () => setPratinjau(await pratinjauImpor(teks)));
  }

  function ulang() {
    setCsv(null);
    setNama("");
    setPratinjau(null);
    setHasil(null);
    if (input.current) input.current.value = "";
  }

  const bisaImpor = pratinjau?.ok && pratinjau.galat.length === 0 && !hasil?.ok;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface p-6">
        <label htmlFor="berkas-csv" className="flex cursor-pointer flex-col items-center gap-2 text-center">
          <FileUp className="size-8 text-hijau" aria-hidden="true" />
          <span className="font-semibold text-hijau">Pilih berkas CSV</span>
          <span className="text-sm text-muted-fg">{nama || "Maksimal 1 MB dan 1000 baris."}</span>
        </label>
        <input
          ref={input}
          id="berkas-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={pilih}
          className="sr-only"
        />
      </div>

      {proses && !hasil && (
        <p className="flex items-center gap-2 text-sm text-muted-fg" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Memeriksa berkas...
        </p>
      )}

      {pratinjau && !pratinjau.ok && <PesanAksi pesan={{ ok: false, teks: pratinjau.pesan }} />}

      {pratinjau?.ok && (
        <section aria-label="Hasil pemeriksaan" className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Baris", pratinjau.ringkasan.baris],
              ["Rumah baru", pratinjau.ringkasan.rumahBaru],
              ["Keluarga baru", pratinjau.ringkasan.keluargaBaru],
              ["Warga baru", pratinjau.ringkasan.wargaBaru],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-surface p-4">
                <dt className="text-xs text-muted-fg">{k}</dt>
                <dd className="mt-1 text-2xl font-bold text-hijau">{v}</dd>
              </div>
            ))}
          </dl>

          {pratinjau.galat.length > 0 ? (
            <div role="alert" className="rounded-xl border border-red-700/30 bg-red-50 p-4">
              <p className="flex items-center gap-2 font-semibold text-red-800">
                <TriangleAlert className="size-4" aria-hidden="true" />
                {pratinjau.galat.length} baris bermasalah. Tidak ada yang diimpor sampai semuanya benar.
              </p>
              <ul className="mt-3 max-h-64 overflow-y-auto text-sm text-red-900">
                {pratinjau.galat.slice(0, 100).map((g, i) => (
                  <li key={i} className="border-t border-red-700/15 py-1.5 first:border-t-0">
                    <span className="font-semibold">Baris {g.baris}:</span> {g.pesan}
                  </li>
                ))}
                {pratinjau.galat.length > 100 && (
                  <li className="pt-2 italic">…dan {pratinjau.galat.length - 100} lainnya.</li>
                )}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-xl border border-hijau/30 bg-hijau/10 p-4 text-sm font-medium text-hijau">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Berkas lolos pemeriksaan. Siap diimpor.
            </p>
          )}
        </section>
      )}

      {hasil && !hasil.ok && <PesanAksi pesan={{ ok: false, teks: hasil.pesan }} />}
      {hasil?.ok && (
        <div className="rounded-xl border border-hijau/30 bg-hijau/10 p-4 text-sm text-hijau">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Impor selesai
          </p>
          <p className="mt-1">
            {hasil.warga} warga, {hasil.keluarga} keluarga, dan {hasil.rumah} rumah baru ditambahkan.
          </p>
          <Link href="/admin/warga" className="mt-3 inline-block font-semibold underline">
            Lihat daftar warga
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {bisaImpor && csv && (
          <button
            type="button"
            disabled={proses}
            className={TOMBOL_UTAMA}
            onClick={() => mulai(async () => setHasil(await jalankanImpor(csv)))}
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            {proses ? "Mengimpor..." : "Impor sekarang"}
          </button>
        )}
        {(csv || hasil) && (
          <button type="button" onClick={ulang} className={TOMBOL_SEKUNDER}>
            {hasil?.ok ? "Impor berkas lain" : "Pilih berkas lain"}
          </button>
        )}
      </div>
    </div>
  );
}
