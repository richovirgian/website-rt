"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { terbitkan } from "@/lib/cms/aksi-tagihan";
import type { HasilTerbit } from "@/lib/tagihan";
import type { Frekuensi } from "@/lib/iuran-label";
import { jatuhTempoBulanan, labelPeriode } from "@/lib/uang";
import { Bidang } from "@/components/cms/bidang";
import { DialogKonfirmasi } from "@/components/cms/dialog-konfirmasi";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

type Jenis = {
  id: string;
  nama: string;
  frekuensi: Frekuensi;
  hariJatuhTempo: number;
  /** Nominal yang berlaku sekarang, untuk ditampilkan. */
  nominalSekarang: string | null;
};
type Rumah = { id: string; kode: string };

/**
 * Menerbitkan tagihan: ke seluruh rumah berpenghuni, atau ke rumah tertentu
 * (termasuk satu rumah saja). Menampilkan konfirmasi dengan jumlah rumah
 * sebelum menulis, dan melaporkan berapa yang dibuat dan dilewati.
 */
export function FormTerbitkan({
  jenis,
  rumah,
  periodeAwal,
}: {
  jenis: Jenis[];
  rumah: Rumah[];
  periodeAwal: string;
}) {
  const [jenisId, setJenisId] = useState(jenis[0]?.id ?? "");
  const j = jenis.find((x) => x.id === jenisId);
  const [periode, setPeriode] = useState(periodeAwal);
  const [jatuhTempo, setJatuhTempo] = useState(jatuhTempoBulanan(periodeAwal, jenis[0]?.hariJatuhTempo ?? 10));
  const [mode, setMode] = useState<"SEMUA" | "PILIH">("SEMUA");
  const [terpilih, setTerpilih] = useState<Set<string>>(new Set());
  const [cari, setCari] = useState("");
  const [nominalKhusus, setNominalKhusus] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [proses, setProses] = useState(false);
  const [hasil, setHasil] = useState<HasilTerbit | null>(null);

  const periodeEfektif = !j ? "" : j.frekuensi === "SEKALI" ? "SEKALI" : j.frekuensi === "TAHUNAN" ? periode.slice(0, 4) : periode;
  const target = mode === "SEMUA" ? rumah.length : terpilih.size;
  const galat = hasil && !hasil.ok ? (hasil.galat ?? {}) : {};
  const tersaring = useMemo(
    () => rumah.filter((r) => r.kode.toLowerCase().includes(cari.trim().toLowerCase())),
    [rumah, cari],
  );

  function gantiJenis(id: string) {
    setJenisId(id);
    const baru = jenis.find((x) => x.id === id);
    if (baru?.frekuensi === "BULANAN") setJatuhTempo(jatuhTempoBulanan(periode.slice(0, 7), baru.hariJatuhTempo));
    setHasil(null);
  }

  async function kirim() {
    setProses(true);
    setHasil(
      await terbitkan({
        jenisIuranId: jenisId,
        periode: periodeEfektif,
        jatuhTempo,
        mode,
        rumahIds: [...terpilih],
        nominalKhusus,
      }),
    );
    setProses(false);
    setKonfirmasi(false);
  }

  if (jenis.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface p-5 text-sm text-muted-fg">
        Belum ada jenis iuran aktif. Tambahkan dulu di halaman{" "}
        <Link href="/admin/iuran" className="font-semibold text-hijau underline">Iuran</Link>.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {hasil?.ok && (
        <div role="status" className="rounded-xl border border-hijau/30 bg-hijau/10 p-4 text-sm text-hijau">
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-4" aria-hidden="true" /> Tagihan diterbitkan
          </p>
          <p className="mt-1">
            {hasil.dibuat} tagihan dibuat
            {hasil.dilewati > 0 && `, ${hasil.dilewati} dilewati karena rumah itu sudah punya tagihan untuk periode ini`}.
          </p>
          <Link href="/admin/tagihan" className="mt-3 inline-block font-semibold underline">Lihat daftar tagihan</Link>
        </div>
      )}
      {hasil && !hasil.ok && <PesanAksi pesan={{ ok: false, teks: hasil.pesan }} />}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setHasil(null);
          setKonfirmasi(true);
        }}
        className="flex flex-col gap-5"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang id="t-jenis" label="Jenis iuran" wajib galat={galat.jenisIuranId} bantuan={j?.nominalSekarang ? `Nominal sekarang ${j.nominalSekarang}.` : undefined}>
            <select id="t-jenis" value={jenisId} onChange={(e) => gantiJenis(e.target.value)} className={KELAS_ISIAN} aria-describedby="t-jenis-info">
              {jenis.map((x) => (
                <option key={x.id} value={x.id}>{x.nama}</option>
              ))}
            </select>
          </Bidang>

          {j?.frekuensi === "BULANAN" && (
            <Bidang id="t-periode" label="Periode (bulan)" wajib galat={galat.periode}>
              <input id="t-periode" type="month" value={periode.slice(0, 7)} onChange={(e) => { setPeriode(e.target.value); if (e.target.value) setJatuhTempo(jatuhTempoBulanan(e.target.value, j.hariJatuhTempo)); }} required className={KELAS_ISIAN} aria-describedby="t-periode-info" />
            </Bidang>
          )}
          {j?.frekuensi === "TAHUNAN" && (
            <Bidang id="t-periode" label="Periode (tahun)" wajib galat={galat.periode}>
              <input id="t-periode" type="number" min={2000} max={2100} value={periode.slice(0, 4)} onChange={(e) => setPeriode(e.target.value)} required className={KELAS_ISIAN} aria-describedby="t-periode-info" />
            </Bidang>
          )}

          <Bidang id="t-tempo" label="Jatuh tempo" wajib galat={galat.jatuhTempo}>
            <input id="t-tempo" type="date" value={jatuhTempo} onChange={(e) => setJatuhTempo(e.target.value)} required className={KELAS_ISIAN} aria-describedby="t-tempo-info" />
          </Bidang>
          <Bidang id="t-nominal" label="Nominal khusus (Rp), opsional" galat={galat.nominalKhusus} bantuan="Kosongkan untuk memakai nominal yang berlaku. Berlaku untuk semua rumah dalam penerbitan ini.">
            <input id="t-nominal" value={nominalKhusus} onChange={(e) => setNominalKhusus(e.target.value)} inputMode="numeric" className={KELAS_ISIAN} aria-describedby="t-nominal-info" />
          </Bidang>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium text-hijau-tua">Ditagihkan ke</legend>
          {([
            ["SEMUA", `Semua rumah berpenghuni (${rumah.length} rumah)`],
            ["PILIH", "Rumah tertentu (pilih sendiri, boleh satu rumah)"],
          ] as const).map(([nilai, label]) => (
            <label key={nilai} className="flex items-center gap-3 text-sm">
              <input type="radio" name="mode" value={nilai} checked={mode === nilai} onChange={() => setMode(nilai)} className="size-4 accent-[#1f5f4a]" />
              {label}
            </label>
          ))}
        </fieldset>

        {mode === "PILIH" && (
          <div className="rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari rumah, contoh G-12" aria-label="Cari rumah" className={`${KELAS_ISIAN} max-w-60`} />
              <button type="button" className={TOMBOL_SEKUNDER} onClick={() => setTerpilih(new Set([...terpilih, ...tersaring.map((r) => r.id)]))}>Pilih yang tampil</button>
              <button type="button" className={TOMBOL_SEKUNDER} onClick={() => setTerpilih(new Set())}>Kosongkan</button>
              <span className="text-sm text-muted-fg">{terpilih.size} dipilih</span>
            </div>
            {galat.rumahIds && <p role="alert" className="mb-2 text-xs text-red-700">{galat.rumahIds}</p>}
            <ul className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-4">
              {tersaring.map((r) => (
                <li key={r.id}>
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-krem-2">
                    <input type="checkbox" checked={terpilih.has(r.id)} onChange={(e) => { const s = new Set(terpilih); if (e.target.checked) s.add(r.id); else s.delete(r.id); setTerpilih(s); }} className="size-4 accent-[#1f5f4a]" />
                    {r.kode}
                  </label>
                </li>
              ))}
              {tersaring.length === 0 && <li className="col-span-full text-sm text-muted-fg">Tidak ada rumah yang cocok.</li>}
            </ul>
          </div>
        )}

        <div>
          <button type="submit" disabled={proses || target === 0} className={TOMBOL_UTAMA}>
            {proses && <Loader2 className="size-4 animate-spin" />}
            Terbitkan tagihan
          </button>
        </div>
      </form>

      <DialogKonfirmasi
        terbuka={konfirmasi}
        judul="Terbitkan tagihan?"
        keterangan={`${j?.nama ?? ""}${periodeEfektif ? ` · ${labelPeriode(periodeEfektif)}` : ""} akan ditagihkan ke ${target} rumah. Rumah yang sudah punya tagihan untuk periode ini dilewati, bukan digandakan.`}
        labelYa="Terbitkan"
        sedangProses={proses}
        onBatal={() => setKonfirmasi(false)}
        onYa={kirim}
      />
    </div>
  );
}
