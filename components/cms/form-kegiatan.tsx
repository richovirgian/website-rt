"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { batalkanKegiatan, konfirmasiHadir, simpanKegiatan } from "@/lib/cms/aksi-kegiatan";
import { JENIS_KEGIATAN, LABEL_JENIS_KEGIATAN, type JenisKegiatan } from "@/lib/komunikasi-label";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { cn } from "@/lib/utils";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

type Awal = {
  id: string;
  judul: string;
  deskripsi: string | null;
  jenis: JenisKegiatan;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string | null;
  lokasi: string;
  penanggungJawab: string | null;
};

export function FormKegiatan({ kegiatan }: { kegiatan?: Awal }) {
  const awal = {
    judul: kegiatan?.judul ?? "",
    deskripsi: kegiatan?.deskripsi ?? "",
    jenis: kegiatan?.jenis ?? ("LAINNYA" as JenisKegiatan),
    tanggal: kegiatan?.tanggal ?? "",
    jamMulai: kegiatan?.jamMulai ?? "19:30",
    jamSelesai: kegiatan?.jamSelesai ?? "",
    lokasi: kegiatan?.lokasi ?? "",
    penanggungJawab: kegiatan?.penanggungJawab ?? "",
  };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const k = kegiatan?.id ?? "baru";
  const ubah = (f: keyof typeof awal) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setN((s) => ({ ...s, [f]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => simpanKegiatan(kegiatan?.id ?? null, n), {
          berhasil: kegiatan ? "Perubahan tersimpan." : "Kegiatan ditambahkan.",
          ke: kegiatan ? undefined : (id) => `/admin/kegiatan/${id}`,
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <Bidang id={`g-judul-${k}`} label="Nama kegiatan" wajib galat={galat.judul}>
          <input id={`g-judul-${k}`} value={n.judul} onChange={ubah("judul")} maxLength={120} required className={KELAS_ISIAN} aria-describedby={`g-judul-${k}-info`} />
        </Bidang>
        <Bidang id={`g-jenis-${k}`} label="Jenis" galat={galat.jenis}>
          <select id={`g-jenis-${k}`} value={n.jenis} onChange={ubah("jenis")} className={KELAS_ISIAN}>
            {JENIS_KEGIATAN.map((j) => (
              <option key={j} value={j}>{LABEL_JENIS_KEGIATAN[j]}</option>
            ))}
          </select>
        </Bidang>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Bidang id={`g-tgl-${k}`} label="Tanggal" wajib galat={galat.tanggal}>
          <input id={`g-tgl-${k}`} type="date" value={n.tanggal} onChange={ubah("tanggal")} required className={KELAS_ISIAN} aria-describedby={`g-tgl-${k}-info`} />
        </Bidang>
        <Bidang id={`g-mulai-${k}`} label="Mulai (WIB)" wajib galat={galat.jamMulai}>
          <input id={`g-mulai-${k}`} type="time" value={n.jamMulai} onChange={ubah("jamMulai")} required className={KELAS_ISIAN} aria-describedby={`g-mulai-${k}-info`} />
        </Bidang>
        <Bidang id={`g-selesai-${k}`} label="Selesai (opsional)" galat={galat.jamSelesai}>
          <input id={`g-selesai-${k}`} type="time" value={n.jamSelesai} onChange={ubah("jamSelesai")} className={KELAS_ISIAN} aria-describedby={`g-selesai-${k}-info`} />
        </Bidang>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id={`g-lokasi-${k}`} label="Lokasi" wajib galat={galat.lokasi}>
          <input id={`g-lokasi-${k}`} value={n.lokasi} onChange={ubah("lokasi")} maxLength={120} required className={KELAS_ISIAN} aria-describedby={`g-lokasi-${k}-info`} />
        </Bidang>
        <Bidang id={`g-pj-${k}`} label="Penanggung jawab (opsional)" galat={galat.penanggungJawab}>
          <input id={`g-pj-${k}`} value={n.penanggungJawab} onChange={ubah("penanggungJawab")} maxLength={100} className={KELAS_ISIAN} aria-describedby={`g-pj-${k}-info`} />
        </Bidang>
      </div>
      <Bidang id={`g-desk-${k}`} label="Keterangan (opsional)" galat={galat.deskripsi}>
        <textarea id={`g-desk-${k}`} value={n.deskripsi} onChange={ubah("deskripsi")} rows={4} maxLength={1000} className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby={`g-desk-${k}-info`} />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : kegiatan ? "Simpan perubahan" : "Tambah kegiatan"}
        </button>
      </div>
    </form>
  );
}

/** Konfirmasi ikut atau tidak. Dua tombol besar, mudah disentuh di ponsel. */
export function TombolHadir({ id, hadir }: { id: string; hadir: boolean | null }) {
  const { proses, pesan, jalankan } = useAksi();
  const pilih = (nilai: boolean) => jalankan(() => konfirmasiHadir(id, nilai), { berhasil: nilai ? "Terkonfirmasi ikut." : "Terkonfirmasi tidak ikut." });
  const gaya = (aktif: boolean) =>
    cn(
      "inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border px-4 text-base font-semibold transition-colors disabled:opacity-60",
      aktif ? "border-hijau bg-hijau text-krem" : "border-line-strong bg-surface text-hijau-tua hover:bg-krem-2",
    );
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <button type="button" disabled={proses} onClick={() => pilih(true)} aria-pressed={hadir === true} className={gaya(hadir === true)}>
          <Check className="size-5" aria-hidden="true" />
          Saya ikut
        </button>
        <button type="button" disabled={proses} onClick={() => pilih(false)} aria-pressed={hadir === false} className={gaya(hadir === false)}>
          <X className="size-5" aria-hidden="true" />
          Tidak ikut
        </button>
      </div>
      <PesanAksi pesan={pesan} />
    </div>
  );
}

export function TombolBatalKegiatan({ id }: { id: string }) {
  return (
    <TombolHapus
      label="Batalkan kegiatan"
      judul="Batalkan kegiatan ini?"
      keterangan="Kegiatan ditandai dibatalkan dan semua warga diberi notifikasi."
      aksi={batalkanKegiatan.bind(null, id)}
    />
  );
}
