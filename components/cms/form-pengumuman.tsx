"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { hapusLampiranPengumuman, simpanPengumuman, tandaiPengumumanDibaca } from "@/lib/cms/aksi-pengumuman";
import { KATEGORI_PENGUMUMAN, LABEL_KATEGORI_PENGUMUMAN, type KategoriPengumuman } from "@/lib/komunikasi-label";
import { Bidang } from "@/components/cms/bidang";
import { kecilkanFormData } from "@/components/cms/kecilkan-gambar";
import { InputLampiran } from "@/components/cms/input-lampiran";
import { DaftarLampiran } from "@/components/cms/lampiran";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";
import { useEffect } from "react";

type Awal = {
  id: string;
  judul: string;
  isi: string;
  kategori: KategoriPengumuman;
  disematkan: boolean;
  /** "DRAFT" | "TETAP" (sudah terbit) | "JADWAL" (terjadwal). */
  mode: "DRAFT" | "TETAP" | "JADWAL";
  tanggalTerbit: string;
  jamTerbit: string;
  lampiran: { id: string; namaBerkas: string; tipe: string; ukuran: number }[];
};

const OPSI = [
  ["DRAFT", "Simpan sebagai draf", "Belum terlihat oleh warga."],
  ["SEKARANG", "Terbitkan sekarang", "Langsung terlihat dan warga diberi notifikasi."],
  ["JADWAL", "Jadwalkan", "Terbit otomatis pada waktu yang dipilih."],
] as const;

export function FormPengumuman({ pengumuman }: { pengumuman?: Awal }) {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<string>(pengumuman?.mode ?? "SEKARANG");

  const pilihan = pengumuman?.mode === "TETAP" ? ([["TETAP", "Biarkan seperti sekarang", "Tetap terbit, waktu terbit tidak berubah."], ...OPSI] as const) : OPSI;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setPesan(null);
        setGalat({});
        const data = new FormData(e.currentTarget);
        mulai(async () => {
          await kecilkanFormData(data, "lampiran");
          const h = await simpanPengumuman(pengumuman?.id ?? null, data);
          if (h.ok) {
            if (pengumuman) {
              setPesan({ ok: true, teks: "Perubahan tersimpan." });
              router.refresh();
            } else router.push(`/admin/pengumuman/${h.id}`);
          } else {
            setGalat(h.galat ?? {});
            setPesan({ ok: false, teks: h.pesan });
          }
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="p-judul" label="Judul" wajib galat={galat.judul}>
        <input id="p-judul" name="judul" defaultValue={pengumuman?.judul} maxLength={120} required className={KELAS_ISIAN} aria-describedby="p-judul-info" aria-invalid={galat.judul ? true : undefined} />
      </Bidang>
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <Bidang id="p-kategori" label="Kategori" wajib galat={galat.kategori}>
          <select id="p-kategori" name="kategori" defaultValue={pengumuman?.kategori ?? "UMUM"} className={KELAS_ISIAN}>
            {KATEGORI_PENGUMUMAN.map((k) => (
              <option key={k} value={k}>{LABEL_KATEGORI_PENGUMUMAN[k]}</option>
            ))}
          </select>
        </Bidang>
        <label className="flex min-h-11 items-center gap-3 self-center text-sm sm:mt-2">
          <input type="checkbox" name="disematkan" defaultChecked={pengumuman?.disematkan} className="size-4 accent-[#1f5f4a]" />
          <span><span className="font-medium text-hijau-tua">Sematkan di atas</span> <span className="text-muted-fg">(tampil paling atas)</span></span>
        </label>
      </div>
      <Bidang id="p-isi" label="Isi pengumuman" wajib galat={galat.isi}>
        <textarea id="p-isi" name="isi" rows={8} defaultValue={pengumuman?.isi} maxLength={5000} required className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="p-isi-info" aria-invalid={galat.isi ? true : undefined} />
      </Bidang>

      {pengumuman && pengumuman.lampiran.length > 0 && (
        <DaftarLampiran berkas={pengumuman.lampiran} judul="Lampiran saat ini" aksi={(b) => <TombolHapusLampiran id={b.id} />} />
      )}
      <InputLampiran label={pengumuman ? "Tambah lampiran (opsional)" : "Lampiran (opsional)"} galat={galat.lampiran} />

      <fieldset className="flex flex-col gap-2.5">
        <legend className="mb-1 text-sm font-medium text-hijau-tua">Penerbitan</legend>
        {pilihan.map(([nilai, label, ket]) => (
          <label key={nilai} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 has-[:checked]:border-hijau has-[:checked]:bg-hijau/5">
            <input type="radio" name="mode" value={nilai} checked={mode === nilai} onChange={() => setMode(nilai)} className="mt-1 size-4 accent-[#1f5f4a]" />
            <span className="text-sm"><span className="font-semibold text-hijau-tua">{label}</span><span className="block text-muted-fg">{ket}</span></span>
          </label>
        ))}
      </fieldset>

      {mode === "JADWAL" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang id="p-tanggal" label="Tanggal terbit" wajib galat={galat.tanggalTerbit}>
            <input id="p-tanggal" name="tanggalTerbit" type="date" defaultValue={pengumuman?.tanggalTerbit} required className={KELAS_ISIAN} aria-describedby="p-tanggal-info" />
          </Bidang>
          <Bidang id="p-jam" label="Jam terbit (WIB)" wajib galat={galat.jamTerbit}>
            <input id="p-jam" name="jamTerbit" type="time" defaultValue={pengumuman?.jamTerbit ?? "07:00"} required className={KELAS_ISIAN} aria-describedby="p-jam-info" />
          </Bidang>
        </div>
      )}

      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : pengumuman ? "Simpan perubahan" : "Simpan"}
        </button>
      </div>
    </form>
  );
}

function TombolHapusLampiran({ id }: { id: string }) {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  return (
    <button
      type="button"
      disabled={proses}
      onClick={() => mulai(async () => { await hapusLampiranPengumuman(id); router.refresh(); })}
      className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-red-700 underline-offset-4 hover:underline disabled:opacity-60"
    >
      <Trash2 className="size-4" aria-hidden="true" />
      Hapus
    </button>
  );
}

/** Menandai pengumuman dibaca saat halamannya dibuka, sekali per kunjungan. */
export function TandaiDibaca({ id }: { id: string }) {
  useEffect(() => {
    void tandaiPengumumanDibaca(id);
  }, [id]);
  return null;
}
