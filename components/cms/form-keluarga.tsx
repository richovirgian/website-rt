"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { buatKeluarga, ubahKeluarga } from "@/lib/cms/aksi-rumah";
import { HUNIAN, LABEL_HUNIAN, type Hunian } from "@/lib/warga-label";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

const tgl = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/** Tambah keluarga pada sebuah rumah, atau ubah keluarga yang ada. */
export function FormKeluarga({
  rumahId,
  keluarga,
}: {
  rumahId: string;
  keluarga?: {
    id: string;
    statusHunian: Hunian;
    tanggalMasuk: Date | null;
    tanggalKeluar: Date | null;
    catatan: string | null;
  };
}) {
  const kunci = keluarga?.id ?? "baru";
  const awal = {
    rumahId,
    statusHunian: keluarga?.statusHunian ?? ("PEMILIK" as Hunian),
    tanggalMasuk: tgl(keluarga?.tanggalMasuk),
    tanggalKeluar: tgl(keluarga?.tanggalKeluar),
    catatan: keluarga?.catatan ?? "",
  };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const ubah = (k: keyof typeof awal) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setN((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => (keluarga ? ubahKeluarga(keluarga.id, n) : buatKeluarga(n)), {
          berhasil: keluarga ? "Perubahan tersimpan." : "Keluarga ditambahkan.",
          selesai: () => !keluarga && setN(awal),
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Bidang id={`hunian-${kunci}`} label="Status hunian" wajib galat={galat.statusHunian}>
          <select id={`hunian-${kunci}`} value={n.statusHunian} onChange={ubah("statusHunian")} className={KELAS_ISIAN}>
            {HUNIAN.map((h) => (
              <option key={h} value={h}>{LABEL_HUNIAN[h]}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id={`masuk-${kunci}`} label="Tanggal masuk" galat={galat.tanggalMasuk}>
          <input id={`masuk-${kunci}`} type="date" value={n.tanggalMasuk} onChange={ubah("tanggalMasuk")} className={KELAS_ISIAN} aria-describedby={`masuk-${kunci}-info`} />
        </Bidang>
        <Bidang id={`keluar-${kunci}`} label="Tanggal pindah" bantuan="Isi bila keluarga sudah pindah." galat={galat.tanggalKeluar}>
          <input id={`keluar-${kunci}`} type="date" value={n.tanggalKeluar} onChange={ubah("tanggalKeluar")} className={KELAS_ISIAN} aria-describedby={`keluar-${kunci}-info`} />
        </Bidang>
      </div>
      <Bidang id={`cat-${kunci}`} label="Catatan" galat={galat.catatan}>
        <input id={`cat-${kunci}`} value={n.catatan} onChange={ubah("catatan")} maxLength={500} className={KELAS_ISIAN} aria-describedby={`cat-${kunci}-info`} />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : keluarga ? "Simpan keluarga" : "Tambah keluarga"}
        </button>
      </div>
    </form>
  );
}
