"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { buatJenisIuran, ubahJenisIuran } from "@/lib/cms/aksi-iuran";
import { FREKUENSI, LABEL_FREKUENSI, type Frekuensi } from "@/lib/iuran-label";
import { hariIni } from "@/lib/uang";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Tambah jenis iuran (dengan nominal awal) atau ubah jenis iuran yang ada. */
export function FormJenisIuran({
  jenis,
}: {
  jenis?: {
    id: string;
    nama: string;
    deskripsi: string | null;
    frekuensi: Frekuensi;
    hariJatuhTempo: number;
    terbitOtomatis: boolean;
    aktif: boolean;
    /** Ada tagihan: frekuensi dikunci. */
    adaTagihan: boolean;
  };
}) {
  const k = jenis?.id ?? "baru";
  const awal = {
    nama: jenis?.nama ?? "",
    deskripsi: jenis?.deskripsi ?? "",
    frekuensi: jenis?.frekuensi ?? ("BULANAN" as Frekuensi),
    hariJatuhTempo: String(jenis?.hariJatuhTempo ?? 10),
    terbitOtomatis: jenis?.terbitOtomatis ?? false,
    aktif: jenis?.aktif ?? true,
    nominal: "",
    berlakuMulai: hariIni().slice(0, 8) + "01",
  };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const id = (b: string) => `${b}-${k}`;
  const ubah = (f: keyof typeof awal) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setN((s) => ({ ...s, [f]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));
  const bulanan = n.frekuensi === "BULANAN";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(
          () =>
            jenis
              ? ubahJenisIuran(jenis.id, {
                  nama: n.nama, deskripsi: n.deskripsi, frekuensi: n.frekuensi,
                  hariJatuhTempo: n.hariJatuhTempo, terbitOtomatis: bulanan && n.terbitOtomatis, aktif: n.aktif,
                })
              : buatJenisIuran({ ...n, terbitOtomatis: bulanan && n.terbitOtomatis }),
          {
            berhasil: jenis ? "Perubahan tersimpan." : "Jenis iuran ditambahkan.",
            selesai: () => !jenis && setN(awal),
          },
        );
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id={id("nama")} label="Nama iuran" wajib galat={galat.nama} bantuan={jenis ? undefined : "Contoh: Iuran Keamanan"}>
          <input id={id("nama")} value={n.nama} onChange={ubah("nama")} maxLength={60} required className={KELAS_ISIAN} aria-describedby={`${id("nama")}-info`} aria-invalid={galat.nama ? true : undefined} />
        </Bidang>
        <Bidang id={id("frekuensi")} label="Frekuensi" wajib galat={galat.frekuensi} bantuan={jenis?.adaTagihan ? "Terkunci karena sudah ada tagihan." : undefined}>
          <select id={id("frekuensi")} value={n.frekuensi} onChange={ubah("frekuensi")} disabled={jenis?.adaTagihan} className={KELAS_ISIAN} aria-describedby={`${id("frekuensi")}-info`}>
            {FREKUENSI.map((f) => (
              <option key={f} value={f}>{LABEL_FREKUENSI[f]}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id={id("deskripsi")} label="Deskripsi" galat={galat.deskripsi} className="sm:col-span-2">
          <input id={id("deskripsi")} value={n.deskripsi} onChange={ubah("deskripsi")} maxLength={300} className={KELAS_ISIAN} aria-describedby={`${id("deskripsi")}-info`} />
        </Bidang>

        {!jenis && (
          <>
            <Bidang id={id("nominal")} label="Nominal (Rp)" wajib galat={galat.nominal} bantuan="Angka saja, tanpa titik. Contoh: 50000">
              <input id={id("nominal")} value={n.nominal} onChange={ubah("nominal")} inputMode="numeric" required className={KELAS_ISIAN} aria-describedby={`${id("nominal")}-info`} aria-invalid={galat.nominal ? true : undefined} />
            </Bidang>
            <Bidang id={id("berlakuMulai")} label="Berlaku mulai" wajib galat={galat.berlakuMulai}>
              <input id={id("berlakuMulai")} type="date" value={n.berlakuMulai} onChange={ubah("berlakuMulai")} required className={KELAS_ISIAN} aria-describedby={`${id("berlakuMulai")}-info`} />
            </Bidang>
          </>
        )}

        {bulanan && (
          <Bidang id={id("hari")} label="Jatuh tempo tiap tanggal" galat={galat.hariJatuhTempo} bantuan="Antara 1 dan 28.">
            <input id={id("hari")} type="number" min={1} max={28} value={n.hariJatuhTempo} onChange={ubah("hariJatuhTempo")} className={KELAS_ISIAN} aria-describedby={`${id("hari")}-info`} />
          </Bidang>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {bulanan && (
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={n.terbitOtomatis} onChange={ubah("terbitOtomatis")} className="mt-0.5 size-4 accent-[#1f5f4a]" />
            <span>
              <span className="font-medium text-hijau-tua">Terbitkan tagihan otomatis tiap bulan</span>
              <span className="block text-muted-fg">Penjadwal menerbitkan tagihan ke seluruh rumah berpenghuni mulai awal bulan, selama jatuh tempo bulan itu belum lewat. Biarkan mati bila ingin menerbitkan sendiri.</span>
            </span>
          </label>
        )}
        {galat.terbitOtomatis && <p role="alert" className="text-xs text-red-700">{galat.terbitOtomatis}</p>}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={n.aktif} onChange={ubah("aktif")} className="mt-0.5 size-4 accent-[#1f5f4a]" />
          <span>
            <span className="font-medium text-hijau-tua">Aktif</span>
            <span className="block text-muted-fg">Iuran yang tidak aktif tidak bisa ditagihkan, tetapi tagihan lamanya tetap ada.</span>
          </span>
        </label>
      </div>

      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : jenis ? "Simpan perubahan" : "Tambah jenis iuran"}
        </button>
      </div>
    </form>
  );
}
