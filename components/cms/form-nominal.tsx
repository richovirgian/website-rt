"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ubahNominalIuran } from "@/lib/cms/aksi-iuran";
import { hariIni } from "@/lib/uang";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Menambah nominal baru. Nominal lama tetap tersimpan sebagai riwayat. */
export function FormNominal({ jenisId }: { jenisId: string }) {
  const [n, setN] = useState({ nominal: "", berlakuMulai: hariIni() });
  const { proses, galat, pesan, jalankan } = useAksi();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => ubahNominalIuran(jenisId, n), {
          berhasil: "Nominal baru tersimpan.",
          selesai: () => setN({ nominal: "", berlakuMulai: hariIni() }),
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id={`nom-${jenisId}`} label="Nominal baru (Rp)" wajib galat={galat.nominal}>
          <input id={`nom-${jenisId}`} value={n.nominal} onChange={(e) => setN((s) => ({ ...s, nominal: e.target.value }))} inputMode="numeric" required className={KELAS_ISIAN} aria-describedby={`nom-${jenisId}-info`} aria-invalid={galat.nominal ? true : undefined} />
        </Bidang>
        <Bidang id={`mul-${jenisId}`} label="Berlaku mulai" wajib galat={galat.berlakuMulai} bantuan="Tagihan yang sudah terbit tidak berubah.">
          <input id={`mul-${jenisId}`} type="date" value={n.berlakuMulai} onChange={(e) => setN((s) => ({ ...s, berlakuMulai: e.target.value }))} required className={KELAS_ISIAN} aria-describedby={`mul-${jenisId}-info`} />
        </Bidang>
      </div>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : "Simpan nominal"}
        </button>
      </div>
    </form>
  );
}
