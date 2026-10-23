"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { ajukanSurat, batalkanSurat, kirimUlangSurat, putuskanSurat, simpanJenisSurat } from "@/lib/cms/aksi-surat";
import { PLACEHOLDER } from "@/lib/surat";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { kecilkanFormData } from "@/components/cms/kecilkan-gambar";
import { InputLampiran } from "@/components/cms/input-lampiran";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { DialogKonfirmasi } from "@/components/cms/dialog-konfirmasi";
import { KELAS_ISIAN, TOMBOL_BAHAYA, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

type Jenis = { id: string; nama: string; deskripsi: string | null };

/** Bentuk umum formulir surat yang mengirim FormData (karena ada lampiran). */
function useKirimForm() {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const kirim = (fn: () => Promise<{ ok: true; id?: string } | { ok: false; pesan: string; galat?: Record<string, string> }>, ke: (id?: string) => string) => {
    setPesan(null);
    setGalat({});
    mulai(async () => {
      const h = await fn();
      if (h.ok) {
        router.push(ke(h.id));
        router.refresh();
      } else {
        setGalat(h.galat ?? {});
        setPesan({ ok: false, teks: h.pesan });
      }
    });
  };
  return { proses, pesan, galat, kirim };
}

export function FormAjukanSurat({ jenis }: { jenis: Jenis[] }) {
  const { proses, pesan, galat, kirim } = useKirimForm();
  const [pilih, setPilih] = useState(jenis[0]?.id ?? "");
  const deskripsi = jenis.find((j) => j.id === pilih)?.deskripsi;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        kirim(async () => ajukanSurat(await kecilkanFormData(data, "lampiran")), (id) => `/admin/surat/${id}`);
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="s-jenis" label="Jenis surat" wajib galat={galat.jenisSuratId} bantuan={deskripsi ?? undefined}>
        <select id="s-jenis" name="jenisSuratId" value={pilih} onChange={(e) => setPilih(e.target.value)} required className={KELAS_ISIAN} aria-describedby="s-jenis-info">
          {jenis.map((j) => (
            <option key={j.id} value={j.id}>{j.nama}</option>
          ))}
        </select>
      </Bidang>
      <Bidang id="s-keperluan" label="Keperluan" wajib galat={galat.keperluan} bantuan="Jelaskan untuk apa surat ini dibutuhkan (10 sampai 500 karakter).">
        <textarea id="s-keperluan" name="keperluan" rows={4} maxLength={500} required className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="s-keperluan-info" aria-invalid={galat.keperluan ? true : undefined} />
      </Bidang>
      <InputLampiran label="Dokumen pendukung (opsional)" galat={galat.lampiran} />
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Mengirim..." : "Ajukan surat"}
        </button>
      </div>
    </form>
  );
}

export function FormKirimUlangSurat({ id, keperluan }: { id: string; keperluan: string }) {
  const { proses, pesan, galat, kirim } = useKirimForm();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        kirim(async () => kirimUlangSurat(id, await kecilkanFormData(data, "lampiran")), () => `/admin/surat/${id}`);
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="u-keperluan" label="Keperluan (perbaiki sesuai catatan)" wajib galat={galat.keperluan}>
        <textarea id="u-keperluan" name="keperluan" rows={4} maxLength={500} required defaultValue={keperluan} className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="u-keperluan-info" />
      </Bidang>
      <InputLampiran id="u-lampiran" label="Tambah dokumen (opsional)" galat={galat.lampiran} />
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Mengirim..." : "Kirim ulang"}
        </button>
      </div>
    </form>
  );
}

export function TombolBatalSurat({ id }: { id: string }) {
  const { proses, pesan, jalankan } = useAksi();
  const [buka, setBuka] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={() => setBuka(true)} className={TOMBOL_BAHAYA}>Batalkan pengajuan</button>
      <PesanAksi pesan={pesan && !pesan.ok ? pesan : null} />
      <DialogKonfirmasi
        terbuka={buka}
        judul="Batalkan pengajuan ini?"
        keterangan="Pengajuan akan dibatalkan dan tidak bisa diajukan lagi. Anda dapat membuat pengajuan baru."
        labelYa="Batalkan"
        sedangProses={proses}
        onBatal={() => setBuka(false)}
        onYa={() => jalankan(() => batalkanSurat(id), { berhasil: "Pengajuan dibatalkan.", selesai: () => setBuka(false) })}
      />
    </div>
  );
}

/** Keputusan Admin: setujui, minta revisi, atau tolak (alasan wajib untuk dua yang terakhir). */
export function AksiPutusanSurat({ id, ringkas }: { id: string; ringkas: string }) {
  const [alasan, setAlasan] = useState("");
  const [konfirmasi, setKonfirmasi] = useState(false);
  const setuju = useAksi();
  const lain = useAksi();
  const terakhir = useRef<"REVISI" | "TOLAK">("REVISI");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <button type="button" onClick={() => setKonfirmasi(true)} disabled={setuju.proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          <Check className="size-4" aria-hidden="true" />
          Setujui dan terbitkan nomor
        </button>
        <PesanAksi pesan={setuju.pesan && !setuju.pesan.ok ? setuju.pesan : null} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          lain.jalankan(() => putuskanSurat(id, { tindakan: terakhir.current, alasan }), { berhasil: "Keputusan tersimpan." });
        }}
        className="flex flex-col gap-2 border-t border-line pt-4"
      >
        <label htmlFor={`alasan-surat-${id}`} className="text-sm font-medium text-hijau-tua">Alasan (wajib untuk revisi atau penolakan, dibaca pemohon)</label>
        <input id={`alasan-surat-${id}`} value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={300} className={KELAS_ISIAN} aria-invalid={lain.galat.alasan ? true : undefined} />
        {lain.galat.alasan && <p role="alert" className="text-xs text-red-700">{lain.galat.alasan}</p>}
        <PesanAksi pesan={lain.pesan && !lain.pesan.ok ? lain.pesan : null} />
        <div className="flex flex-wrap gap-2.5">
          <button type="submit" onClick={() => (terakhir.current = "REVISI")} disabled={lain.proses} className={TOMBOL_SEKUNDER}>Minta revisi</button>
          <button type="submit" onClick={() => (terakhir.current = "TOLAK")} disabled={lain.proses} className={TOMBOL_BAHAYA}>Tolak</button>
        </div>
      </form>

      <DialogKonfirmasi
        terbuka={konfirmasi}
        judul="Setujui surat ini?"
        keterangan={`${ringkas} Nomor surat akan diterbitkan, dan pemohon diberi tahu. Pastikan data pemohon dan keperluannya sudah benar.`}
        labelYa="Setujui"
        sedangProses={setuju.proses}
        onBatal={() => setKonfirmasi(false)}
        onYa={() => setuju.jalankan(() => putuskanSurat(id, { tindakan: "SETUJUI", alasan: "" }), { berhasil: "Surat disetujui.", selesai: () => setKonfirmasi(false) })}
      />
    </div>
  );
}

export function FormJenisSurat({ jenis }: { jenis?: { id: string; nama: string; kode: string; deskripsi: string | null; templat: string; aktif: boolean } }) {
  const k = jenis?.id ?? "baru";
  const awal = { nama: jenis?.nama ?? "", kode: jenis?.kode ?? "", deskripsi: jenis?.deskripsi ?? "", templat: jenis?.templat ?? "", aktif: jenis?.aktif ?? true };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const id = (b: string) => `${b}-${k}`;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => simpanJenisSurat(jenis?.id ?? null, n), { berhasil: "Tersimpan.", selesai: () => !jenis && setN(awal) });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Bidang id={id("nama")} label="Nama surat" wajib galat={galat.nama}>
          <input id={id("nama")} value={n.nama} onChange={(e) => setN((s) => ({ ...s, nama: e.target.value }))} maxLength={60} required className={KELAS_ISIAN} aria-describedby={`${id("nama")}-info`} />
        </Bidang>
        <Bidang id={id("kode")} label="Kode nomor" wajib galat={galat.kode} bantuan="2 sampai 6 huruf">
          <input id={id("kode")} value={n.kode} onChange={(e) => setN((s) => ({ ...s, kode: e.target.value.toUpperCase() }))} maxLength={6} required className={KELAS_ISIAN} aria-describedby={`${id("kode")}-info`} />
        </Bidang>
      </div>
      <Bidang id={id("deskripsi")} label="Deskripsi singkat" galat={galat.deskripsi}>
        <input id={id("deskripsi")} value={n.deskripsi} onChange={(e) => setN((s) => ({ ...s, deskripsi: e.target.value }))} maxLength={200} className={KELAS_ISIAN} aria-describedby={`${id("deskripsi")}-info`} />
      </Bidang>
      <Bidang id={id("templat")} label="Templat isi surat" wajib galat={galat.templat}>
        <textarea id={id("templat")} value={n.templat} onChange={(e) => setN((s) => ({ ...s, templat: e.target.value }))} rows={11} maxLength={3000} required className={`${KELAS_ISIAN} h-auto py-2.5 font-mono text-sm`} aria-describedby={`${id("templat")}-info`} />
      </Bidang>
      <details className="rounded-xl bg-krem-2 p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-hijau">Penanda yang bisa dipakai</summary>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {Object.entries(PLACEHOLDER).map(([nama, ket]) => (
            <li key={nama}><code className="font-mono font-semibold text-hijau">{`{{${nama}}}`}</code> <span className="text-muted-fg">{ket}</span></li>
          ))}
        </ul>
      </details>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" checked={n.aktif} onChange={(e) => setN((s) => ({ ...s, aktif: e.target.checked }))} className="size-4 accent-[#1f5f4a]" />
        <span className="font-medium text-hijau-tua">Aktif (bisa diajukan warga)</span>
      </label>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : jenis ? "Simpan perubahan" : "Tambah jenis surat"}
        </button>
      </div>
    </form>
  );
}
