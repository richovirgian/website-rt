"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { isiContohArtikel, isiContohStruktur, simpanArtikel, simpanPengurus, tambahFoto, ubahFoto } from "@/lib/cms/aksi-situs";
import { KATEGORI_ARTIKEL_DB, LABEL_KATEGORI_ARTIKEL } from "@/lib/kategori-artikel";
import type { HasilAksi } from "@/lib/aksi";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { bolehDiunggah, kecilkanFormData } from "@/components/cms/kecilkan-gambar";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Mengirim FormData berisi gambar: diperkecil dulu di peramban, lalu dikirim. */
function useKirimGambar(namaBerkas: string) {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const kirim = (data: FormData, fn: (d: FormData) => Promise<HasilAksi>, opsi: { berhasil: string; ke?: (id?: string) => string; selesai?: () => void }) => {
    setPesan(null);
    setGalat({});
    mulai(async () => {
      await kecilkanFormData(data, namaBerkas);
      const h = await fn(data);
      if (h.ok) {
        setPesan({ ok: true, teks: opsi.berhasil });
        opsi.selesai?.();
        if (opsi.ke) router.push(opsi.ke(h.id));
        else router.refresh();
      } else {
        setGalat(h.galat ?? {});
        setPesan({ ok: false, teks: h.pesan });
      }
    });
  };
  return { proses, pesan, galat, kirim };
}

const inputGambar = `${KELAS_ISIAN} h-auto py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-hijau file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-krem`;

type ArtikelAwal = {
  id: string;
  judul: string;
  kategori: keyof typeof LABEL_KATEGORI_ARTIKEL;
  ringkas: string;
  isi: string;
  penulis: string;
  tanggal: string;
  status: "DRAFT" | "TERBIT";
  adaCover: boolean;
};

export function FormArtikel({ artikel, penulisAwal, tanggalAwal }: { artikel?: ArtikelAwal; penulisAwal: string; tanggalAwal: string }) {
  const { proses, pesan, galat, kirim } = useKirimGambar("cover");
  const [salah, setSalah] = useState<string | undefined>();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        kirim(data, (d) => simpanArtikel(artikel?.id ?? null, d), {
          berhasil: artikel ? "Perubahan tersimpan." : "Artikel disimpan.",
          ke: artikel ? undefined : (id) => `/admin/situs/artikel/${id}`,
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="ar-judul" label="Judul" wajib galat={galat.judul}>
        <input id="ar-judul" name="judul" defaultValue={artikel?.judul} maxLength={120} required className={KELAS_ISIAN} aria-describedby="ar-judul-info" aria-invalid={galat.judul ? true : undefined} />
      </Bidang>
      <div className="grid gap-4 sm:grid-cols-3">
        <Bidang id="ar-kategori" label="Kategori" wajib galat={galat.kategori}>
          <select id="ar-kategori" name="kategori" defaultValue={artikel?.kategori ?? "PENGUMUMAN"} className={KELAS_ISIAN}>
            {KATEGORI_ARTIKEL_DB.map((k) => (
              <option key={k} value={k}>{LABEL_KATEGORI_ARTIKEL[k]}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id="ar-penulis" label="Penulis" wajib galat={galat.penulis}>
          <input id="ar-penulis" name="penulis" defaultValue={artikel?.penulis ?? penulisAwal} maxLength={60} required className={KELAS_ISIAN} aria-describedby="ar-penulis-info" />
        </Bidang>
        <Bidang id="ar-tanggal" label="Tanggal" wajib galat={galat.tanggal}>
          <input id="ar-tanggal" name="tanggal" type="date" defaultValue={artikel?.tanggal ?? tanggalAwal} required className={KELAS_ISIAN} aria-describedby="ar-tanggal-info" />
        </Bidang>
      </div>
      <Bidang id="ar-ringkas" label="Ringkasan" wajib galat={galat.ringkas} bantuan="Satu dua kalimat yang tampil di daftar artikel.">
        <textarea id="ar-ringkas" name="ringkas" rows={2} defaultValue={artikel?.ringkas} maxLength={300} required className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="ar-ringkas-info" />
      </Bidang>
      <Bidang id="ar-isi" label="Isi artikel" wajib galat={galat.isi} bantuan="Pisahkan paragraf dengan baris kosong. Awali baris dengan ## untuk membuat subjudul.">
        <textarea id="ar-isi" name="isi" rows={14} defaultValue={artikel?.isi} maxLength={20000} required className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="ar-isi-info" aria-invalid={galat.isi ? true : undefined} />
      </Bidang>
      <Bidang id="ar-cover" label={artikel?.adaCover ? "Ganti gambar sampul (opsional)" : "Gambar sampul (opsional)"} galat={salah ?? galat.cover} bantuan="Foto JPG, PNG, atau WebP. Diperkecil otomatis.">
        <input
          id="ar-cover"
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setSalah(f && !bolehDiunggah(f, 0) ? "Gambar maksimal 20 MB." : undefined);
          }}
          className={inputGambar}
          aria-describedby="ar-cover-info"
        />
      </Bidang>
      {artikel?.adaCover && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="hapusCover" className="size-4 accent-[#1f5f4a]" />
          <span className="font-medium text-hijau-tua">Hapus gambar sampul yang ada</span>
        </label>
      )}
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-hijau-tua">Status</legend>
        {([["TERBIT", "Terbit", "Langsung tampil di situs publik."], ["DRAFT", "Draf", "Belum tampil di situs publik."]] as const).map(([nilai, label, ket]) => (
          <label key={nilai} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface px-4 py-2.5 has-[:checked]:border-hijau has-[:checked]:bg-hijau/5">
            <input type="radio" name="status" value={nilai} defaultChecked={(artikel?.status ?? "TERBIT") === nilai} className="mt-1 size-4 accent-[#1f5f4a]" />
            <span className="text-sm"><span className="font-semibold text-hijau-tua">{label}</span><span className="block text-muted-fg">{ket}</span></span>
          </label>
        ))}
      </fieldset>
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : artikel ? "Simpan perubahan" : "Simpan artikel"}
        </button>
      </div>
    </form>
  );
}

/** Tombol yang menyalin isi contoh bawaan ke database. */
export function TombolContoh({ jenis, label }: { jenis: "artikel" | "struktur"; label: string }) {
  const { proses, pesan, jalankan } = useAksi();
  return (
    <div className="flex flex-col gap-2">
      <button type="button" disabled={proses} onClick={() => jalankan(() => (jenis === "artikel" ? isiContohArtikel() : isiContohStruktur()), { berhasil: "Contoh disalin. Silakan sunting." })} className={TOMBOL_SEKUNDER}>
        {proses ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" aria-hidden="true" />}
        {label}
      </button>
      <PesanAksi pesan={pesan && !pesan.ok ? pesan : null} />
    </div>
  );
}

export function FormTambahFoto() {
  const { proses, pesan, galat, kirim } = useKirimGambar("foto");
  const [salah, setSalah] = useState<string | undefined>();
  const [kunci, setKunci] = useState(0);
  return (
    <form
      key={kunci}
      onSubmit={(e) => {
        e.preventDefault();
        kirim(new FormData(e.currentTarget), tambahFoto, { berhasil: "Foto ditambahkan.", selesai: () => setKunci((k) => k + 1) });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="f-foto" label="Foto" wajib galat={salah ?? galat.foto} bantuan="JPG, PNG, atau WebP. Foto kamera diperkecil otomatis.">
        <input id="f-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(e) => { const f = e.target.files?.[0]; setSalah(f && !bolehDiunggah(f, 0) ? "Gambar maksimal 20 MB." : undefined); }} className={inputGambar} aria-describedby="f-foto-info" />
      </Bidang>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id="f-judul" label="Judul" wajib galat={galat.judul} bantuan="Contoh: Kerja bakti Oktober">
          <input id="f-judul" name="judul" maxLength={80} required className={KELAS_ISIAN} aria-describedby="f-judul-info" />
        </Bidang>
        <Bidang id="f-ket" label="Keterangan (opsional)" galat={galat.keterangan}>
          <input id="f-ket" name="keterangan" maxLength={160} className={KELAS_ISIAN} aria-describedby="f-ket-info" />
        </Bidang>
      </div>
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Mengunggah..." : "Tambah foto"}
        </button>
      </div>
    </form>
  );
}

export function FormUbahFoto({ foto }: { foto: { id: string; judul: string; keterangan: string | null; urutan: number } }) {
  const [n, setN] = useState({ judul: foto.judul, keterangan: foto.keterangan ?? "", urutan: String(foto.urutan) });
  const { proses, galat, pesan, jalankan } = useAksi();
  const k = foto.id;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => ubahFoto(foto.id, n), { berhasil: "Tersimpan." });
      }}
      className="flex flex-col gap-3"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id={`uf-judul-${k}`} label="Judul" wajib galat={galat.judul}>
        <input id={`uf-judul-${k}`} value={n.judul} onChange={(e) => setN((s) => ({ ...s, judul: e.target.value }))} maxLength={80} required className={KELAS_ISIAN} aria-describedby={`uf-judul-${k}-info`} />
      </Bidang>
      <Bidang id={`uf-ket-${k}`} label="Keterangan" galat={galat.keterangan}>
        <input id={`uf-ket-${k}`} value={n.keterangan} onChange={(e) => setN((s) => ({ ...s, keterangan: e.target.value }))} maxLength={160} className={KELAS_ISIAN} aria-describedby={`uf-ket-${k}-info`} />
      </Bidang>
      <Bidang id={`uf-urut-${k}`} label="Urutan" galat={galat.urutan} bantuan="Angka kecil tampil lebih dulu.">
        <input id={`uf-urut-${k}`} type="number" min={0} max={9999} value={n.urutan} onChange={(e) => setN((s) => ({ ...s, urutan: e.target.value }))} className={KELAS_ISIAN} aria-describedby={`uf-urut-${k}-info`} />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          Simpan
        </button>
      </div>
    </form>
  );
}

type Tingkat = "KETUA" | "INTI" | "SEKSI";

/** Mengubah atau menambah satu pengurus: nama, jabatan, tugas, dan urutan. */
export function FormPengurus({ tingkat, pengurus }: { tingkat: Tingkat; pengurus?: { id: string; jabatan: string; nama: string; tugas: string; urutan: number } }) {
  const awal = { tingkat, jabatan: pengurus?.jabatan ?? "", nama: pengurus?.nama ?? "", tugas: pengurus?.tugas ?? "", urutan: String(pengurus?.urutan ?? 0) };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const k = pengurus?.id ?? `baru-${tingkat}`;
  const ubah = (f: keyof typeof awal) => (e: React.ChangeEvent<HTMLInputElement>) => setN((s) => ({ ...s, [f]: e.target.value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => simpanPengurus(pengurus?.id ?? null, n), { berhasil: pengurus ? "Tersimpan." : "Pengurus ditambahkan.", selesai: () => !pengurus && setN(awal) });
      }}
      className="flex flex-col gap-3"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Bidang id={`pg-nama-${k}`} label="Nama" wajib galat={galat.nama}>
          <input id={`pg-nama-${k}`} value={n.nama} onChange={ubah("nama")} maxLength={80} required className={KELAS_ISIAN} aria-describedby={`pg-nama-${k}-info`} aria-invalid={galat.nama ? true : undefined} />
        </Bidang>
        <Bidang id={`pg-jabatan-${k}`} label="Jabatan" wajib galat={galat.jabatan}>
          <input id={`pg-jabatan-${k}`} value={n.jabatan} onChange={ubah("jabatan")} maxLength={60} required className={KELAS_ISIAN} aria-describedby={`pg-jabatan-${k}-info`} />
        </Bidang>
      </div>
      <Bidang id={`pg-tugas-${k}`} label="Tugas" wajib galat={galat.tugas}>
        <input id={`pg-tugas-${k}`} value={n.tugas} onChange={ubah("tugas")} maxLength={160} required className={KELAS_ISIAN} aria-describedby={`pg-tugas-${k}-info`} />
      </Bidang>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
        <Bidang id={`pg-urut-${k}`} label="Urutan" galat={galat.urutan}>
          <input id={`pg-urut-${k}`} type="number" min={0} max={9999} value={n.urutan} onChange={ubah("urutan")} className={KELAS_ISIAN} aria-describedby={`pg-urut-${k}-info`} />
        </Bidang>
        {galat.tingkat && <p role="alert" className="self-end text-xs text-red-700">{galat.tingkat}</p>}
      </div>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {pengurus ? "Simpan" : "Tambah pengurus"}
        </button>
      </div>
    </form>
  );
}
