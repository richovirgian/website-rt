"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { buatRumah, ubahRumah } from "@/lib/cms/aksi-rumah";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

type NilaiRumah = { blok: string; nomor: string; alamat: string; catatan: string };

/** Tambah rumah (tanpa `rumah`) atau ubah rumah (dengan `rumah`). */
export function FormRumah({
  rumah,
}: {
  rumah?: { id: string; blok: string; nomor: string; alamat: string | null; catatan: string | null };
}) {
  const awal: NilaiRumah = {
    blok: rumah?.blok ?? "G",
    nomor: rumah?.nomor ?? "",
    alamat: rumah?.alamat ?? "",
    catatan: rumah?.catatan ?? "",
  };
  const [n, setN] = useState(awal);
  const { proses, galat, pesan, jalankan } = useAksi();
  const ubah = (k: keyof NilaiRumah) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setN((s) => ({ ...s, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => (rumah ? ubahRumah(rumah.id, n) : buatRumah(n)), {
          berhasil: rumah ? "Perubahan tersimpan." : "Rumah ditambahkan.",
          selesai: () => !rumah && setN({ ...awal, nomor: "", alamat: "", catatan: "" }),
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Bidang id={`blok-${rumah?.id ?? "baru"}`} label="Blok" wajib galat={galat.blok}>
          <input id={`blok-${rumah?.id ?? "baru"}`} value={n.blok} onChange={ubah("blok")} maxLength={10} required className={KELAS_ISIAN} aria-describedby={`blok-${rumah?.id ?? "baru"}-info`} aria-invalid={galat.blok ? true : undefined} />
        </Bidang>
        <Bidang id={`nomor-${rumah?.id ?? "baru"}`} label="Nomor rumah" wajib galat={galat.nomor}>
          <input id={`nomor-${rumah?.id ?? "baru"}`} value={n.nomor} onChange={ubah("nomor")} maxLength={10} required className={KELAS_ISIAN} aria-describedby={`nomor-${rumah?.id ?? "baru"}-info`} aria-invalid={galat.nomor ? true : undefined} />
        </Bidang>
      </div>
      <Bidang id={`alamat-${rumah?.id ?? "baru"}`} label="Alamat" bantuan="Opsional. Contoh: Jl. Melati No. 12" galat={galat.alamat}>
        <input id={`alamat-${rumah?.id ?? "baru"}`} value={n.alamat} onChange={ubah("alamat")} maxLength={200} className={KELAS_ISIAN} aria-describedby={`alamat-${rumah?.id ?? "baru"}-info`} />
      </Bidang>
      <Bidang id={`catatan-${rumah?.id ?? "baru"}`} label="Catatan" galat={galat.catatan}>
        <input id={`catatan-${rumah?.id ?? "baru"}`} value={n.catatan} onChange={ubah("catatan")} maxLength={500} className={KELAS_ISIAN} aria-describedby={`catatan-${rumah?.id ?? "baru"}-info`} />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Menyimpan..." : rumah ? "Simpan perubahan" : "Tambah rumah"}
        </button>
      </div>
    </form>
  );
}
