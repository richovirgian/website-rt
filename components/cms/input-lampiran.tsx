"use client";

import { useState } from "react";
import { MAKS_LAMPIRAN } from "@/lib/lampiran";
import { Bidang } from "@/components/cms/bidang";
import { bolehDiunggah } from "@/components/cms/kecilkan-gambar";
import { KELAS_ISIAN } from "@/components/cms/gaya";

/**
 * Pemilih lampiran (maks. 3 berkas, 2 MB). Diperiksa di peramban supaya
 * tidak menunggu unggahan yang pasti ditolak; pemeriksaan sebenarnya (isi
 * berkas) tetap di server.
 */
export function InputLampiran({ id = "lampiran", label = "Lampiran (opsional)", galat }: { id?: string; label?: string; galat?: string }) {
  const [salah, setSalah] = useState<string | undefined>();
  return (
    <Bidang id={id} label={label} galat={salah ?? galat} bantuan={`Foto atau PDF, maksimal ${MAKS_LAMPIRAN} berkas. Foto diperkecil otomatis; PDF maksimal 2 MB.`}>
      <input
        id={id}
        name="lampiran"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={(e) => {
          const f = [...(e.target.files ?? [])];
          if (f.length > MAKS_LAMPIRAN) setSalah(`Maksimal ${MAKS_LAMPIRAN} berkas.`);
          else if (f.some((x) => !bolehDiunggah(x))) setSalah("PDF maksimal 2 MB, dan foto maksimal 20 MB.");
          else setSalah(undefined);
        }}
        className={`${KELAS_ISIAN} h-auto py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-hijau file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-krem`}
        aria-describedby={`${id}-info`}
        aria-invalid={salah || galat ? true : undefined}
      />
    </Bidang>
  );
}
