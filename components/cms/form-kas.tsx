"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { catatKas, koreksiKas, tambahKategoriKas } from "@/lib/cms/aksi-kas";
import { hariIni } from "@/lib/uang";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_BAHAYA, TOMBOL_UTAMA } from "@/components/cms/gaya";

type Kategori = { id: string; nama: string; jenis: "MASUK" | "KELUAR" };

/** Mencatat pemasukan lain (donasi, dan sebagainya) atau pengeluaran. */
export function FormCatatKas({ kategori }: { kategori: Kategori[] }) {
  const awal = { jenis: "KELUAR" as "MASUK" | "KELUAR", kategoriId: "", nominal: "", tanggal: hariIni(), deskripsi: "" };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const pilihan = kategori.filter((k) => k.jenis === n.jenis);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => catatKas(n), { berhasil: "Transaksi tercatat.", selesai: () => setN({ ...awal, jenis: n.jenis }) });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <fieldset className="flex gap-3">
        <legend className="mb-1 text-sm font-medium text-hijau-tua">Jenis</legend>
        {(["KELUAR", "MASUK"] as const).map((j) => (
          <label key={j} className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-surface text-sm font-semibold has-[:checked]:border-hijau has-[:checked]:bg-hijau has-[:checked]:text-krem">
            <input type="radio" name="jenis" value={j} checked={n.jenis === j} onChange={() => setN((s) => ({ ...s, jenis: j, kategoriId: "" }))} className="sr-only" />
            {j === "KELUAR" ? "Pengeluaran" : "Pemasukan lain"}
          </label>
        ))}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id="k-kategori" label="Kategori" wajib galat={galat.kategoriId}>
          <select id="k-kategori" value={n.kategoriId} onChange={(e) => setN((s) => ({ ...s, kategoriId: e.target.value }))} required className={KELAS_ISIAN} aria-describedby="k-kategori-info">
            <option value="">Pilih kategori</option>
            {pilihan.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id="k-nominal" label="Nominal (Rp)" wajib galat={galat.nominal} bantuan="Angka saja, tanpa titik.">
          <input id="k-nominal" value={n.nominal} onChange={(e) => setN((s) => ({ ...s, nominal: e.target.value }))} inputMode="numeric" required className={KELAS_ISIAN} aria-describedby="k-nominal-info" aria-invalid={galat.nominal ? true : undefined} />
        </Bidang>
        <Bidang id="k-tanggal" label="Tanggal" wajib galat={galat.tanggal}>
          <input id="k-tanggal" type="date" value={n.tanggal} max={hariIni()} onChange={(e) => setN((s) => ({ ...s, tanggal: e.target.value }))} required className={KELAS_ISIAN} aria-describedby="k-tanggal-info" />
        </Bidang>
        <Bidang id="k-deskripsi" label="Keterangan" wajib galat={galat.deskripsi} bantuan="Contoh: Upah petugas kebersihan Oktober">
          <input id="k-deskripsi" value={n.deskripsi} onChange={(e) => setN((s) => ({ ...s, deskripsi: e.target.value }))} maxLength={200} required className={KELAS_ISIAN} aria-describedby="k-deskripsi-info" />
        </Bidang>
      </div>
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : "Catat transaksi"}
        </button>
      </div>
    </form>
  );
}

export function FormKategoriKas() {
  const [n, setN] = useState({ nama: "", jenis: "KELUAR" as "MASUK" | "KELUAR" });
  const { proses, galat, pesan, jalankan } = useAksi();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => tambahKategoriKas(n), { berhasil: "Kategori ditambahkan.", selesai: () => setN({ ...n, nama: "" }) });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id="kat-nama" label="Nama kategori" wajib galat={galat.nama}>
          <input id="kat-nama" value={n.nama} onChange={(e) => setN((s) => ({ ...s, nama: e.target.value }))} maxLength={40} required className={KELAS_ISIAN} aria-describedby="kat-nama-info" />
        </Bidang>
        <Bidang id="kat-jenis" label="Untuk">
          <select id="kat-jenis" value={n.jenis} onChange={(e) => setN((s) => ({ ...s, jenis: e.target.value as "MASUK" | "KELUAR" }))} className={KELAS_ISIAN}>
            <option value="KELUAR">Pengeluaran</option>
            <option value="MASUK">Pemasukan</option>
          </select>
        </Bidang>
      </div>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          Tambah kategori
        </button>
      </div>
    </form>
  );
}

/** Koreksi transaksi manual dengan transaksi pembalik (alasan wajib). */
export function TombolKoreksiKas({ id, nomor }: { id: string; nomor: string }) {
  const [alasan, setAlasan] = useState("");
  const { proses, galat, pesan, jalankan } = useAksi();
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-semibold text-red-700 underline-offset-4 hover:underline marker:hidden [&::-webkit-details-marker]:hidden">
        Koreksi
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          jalankan(() => koreksiKas(id, { alasan }), { berhasil: "Transaksi dikoreksi." });
        }}
        className="mt-3 flex w-full max-w-72 flex-col gap-2"
      >
        <p className="text-xs text-muted-fg">Membuat transaksi pembalik untuk {nomor}. Catatan lama tidak dihapus.</p>
        <label htmlFor={`kor-${id}`} className="text-xs font-medium text-hijau-tua">Alasan</label>
        <input id={`kor-${id}`} value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={300} minLength={5} required className={KELAS_ISIAN} aria-invalid={galat.alasan ? true : undefined} />
        {galat.alasan && <p role="alert" className="text-xs text-red-700">{galat.alasan}</p>}
        <PesanAksi pesan={pesan && !pesan.ok ? pesan : null} />
        <button type="submit" disabled={proses} className={TOMBOL_BAHAYA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          Ya, koreksi
        </button>
      </form>
    </details>
  );
}
