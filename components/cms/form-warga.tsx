"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { buatWarga, ubahWarga } from "@/lib/cms/aksi-warga";
import {
  DOMISILI,
  HUBUNGAN,
  JENIS_KELAMIN,
  LABEL_DOMISILI,
  LABEL_HUBUNGAN,
  LABEL_JK,
  type Domisili,
  type Hubungan,
  type JenisKelamin,
} from "@/lib/warga-label";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

const tgl = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

type Awal = {
  id: string;
  namaLengkap: string;
  jenisKelamin: JenisKelamin | null;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  hubungan: Hubungan;
  statusDomisili: Domisili;
  noHp: string | null;
  pekerjaan: string | null;
};

/**
 * Tambah warga ke sebuah keluarga, atau ubah data warga. Pada mode ubah, NIK
 * yang dikosongkan berarti TIDAK diubah: NIK lama tidak pernah dikirim ke
 * peramban.
 */
export function FormWarga({
  keluargaId,
  warga,
  kembaliKe,
  adaNik = false,
}: {
  keluargaId: string;
  warga?: Awal;
  kembaliKe?: string;
  /** Warga sudah punya NIK tersimpan, jadi isian NIK boleh kosong saat ubah. */
  adaNik?: boolean;
}) {
  const [n, setN] = useState({
    keluargaId,
    namaLengkap: warga?.namaLengkap ?? "",
    nik: "",
    jenisKelamin: warga?.jenisKelamin ?? "",
    tempatLahir: warga?.tempatLahir ?? "",
    tanggalLahir: tgl(warga?.tanggalLahir),
    hubungan: warga?.hubungan ?? ("ANAK" as Hubungan),
    statusDomisili: warga?.statusDomisili ?? ("AKTIF" as Domisili),
    noHp: warga?.noHp ?? "",
    pekerjaan: warga?.pekerjaan ?? "",
  });
  const { proses, galat, pesan, jalankan } = useAksi();
  const ubah = (k: keyof typeof n) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setN((s) => ({ ...s, [k]: e.target.value }));
  const p = (k: string) => ({ id: `w-${k}`, "aria-describedby": `w-${k}-info`, "aria-invalid": galat[k] ? (true as const) : undefined, className: KELAS_ISIAN });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => (warga ? ubahWarga(warga.id, n) : buatWarga(n)), {
          berhasil: warga ? "Perubahan tersimpan." : "Warga ditambahkan.",
          ke: kembaliKe ? () => kembaliKe : undefined,
          selesai: () => warga && setN((s) => ({ ...s, nik: "" })),
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id="w-namaLengkap" label="Nama lengkap" wajib galat={galat.namaLengkap} className="sm:col-span-2">
          <input {...p("namaLengkap")} value={n.namaLengkap} onChange={ubah("namaLengkap")} maxLength={100} required autoComplete="off" />
        </Bidang>

        <Bidang id="w-nik" label="NIK" wajib={!adaNik} galat={galat.nik} bantuan={adaNik ? "Kosongkan bila tidak diubah." : "16 digit. Disimpan terenkripsi."}>
          <input {...p("nik")} value={n.nik} onChange={ubah("nik")} inputMode="numeric" maxLength={16} minLength={16} pattern="[0-9]{16}" required={!adaNik} autoComplete="off" />
        </Bidang>
        <Bidang id="w-jenisKelamin" label="Jenis kelamin" wajib galat={galat.jenisKelamin}>
          <select {...p("jenisKelamin")} value={n.jenisKelamin} onChange={ubah("jenisKelamin")} required>
            <option value="">Pilih jenis kelamin</option>
            {JENIS_KELAMIN.map((j) => (
              <option key={j} value={j}>{LABEL_JK[j]}</option>
            ))}
          </select>
        </Bidang>

        <Bidang id="w-tempatLahir" label="Tempat lahir" wajib galat={galat.tempatLahir}>
          <input {...p("tempatLahir")} value={n.tempatLahir} onChange={ubah("tempatLahir")} maxLength={80} required />
        </Bidang>
        <Bidang id="w-tanggalLahir" label="Tanggal lahir" galat={galat.tanggalLahir}>
          <input {...p("tanggalLahir")} type="date" value={n.tanggalLahir} onChange={ubah("tanggalLahir")} />
        </Bidang>

        <Bidang id="w-hubungan" label="Hubungan dalam keluarga" wajib galat={galat.hubungan}>
          <select {...p("hubungan")} value={n.hubungan} onChange={ubah("hubungan")}>
            {HUBUNGAN.map((h) => (
              <option key={h} value={h}>{LABEL_HUBUNGAN[h]}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id="w-statusDomisili" label="Status domisili" wajib galat={galat.statusDomisili}>
          <select {...p("statusDomisili")} value={n.statusDomisili} onChange={ubah("statusDomisili")}>
            {DOMISILI.map((d) => (
              <option key={d} value={d}>{LABEL_DOMISILI[d]}</option>
            ))}
          </select>
        </Bidang>

        <Bidang id="w-noHp" label="Nomor HP" wajib galat={galat.noHp} bantuan="Contoh: 081234567890">
          <input {...p("noHp")} type="tel" value={n.noHp} onChange={ubah("noHp")} required />
        </Bidang>
        <Bidang id="w-pekerjaan" label="Pekerjaan" galat={galat.pekerjaan}>
          <input {...p("pekerjaan")} value={n.pekerjaan} onChange={ubah("pekerjaan")} maxLength={80} />
        </Bidang>
      </div>

      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : warga ? "Simpan perubahan" : "Tambah warga"}
        </button>
      </div>
    </form>
  );
}
