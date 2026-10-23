"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { HasilAksi } from "@/lib/aksi";
import { DialogKonfirmasi } from "@/components/cms/dialog-konfirmasi";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { TOMBOL_BAHAYA } from "@/components/cms/gaya";

/**
 * Tombol tindakan berisiko dengan dialog konfirmasi. Setelah berhasil,
 * pindah ke `kembaliKe` bila diberikan, atau memuat ulang halaman.
 */
export function TombolHapus({
  label,
  judul,
  keterangan,
  aksi,
  kembaliKe,
}: {
  label: string;
  judul: string;
  keterangan: string;
  aksi: () => Promise<HasilAksi>;
  kembaliKe?: string;
}) {
  const router = useRouter();
  const [buka, setBuka] = useState(false);
  const [proses, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={() => { setPesan(null); setBuka(true); }} className={TOMBOL_BAHAYA}>
        <Trash2 className="size-4" aria-hidden="true" />
        {label}
      </button>
      <PesanAksi pesan={pesan} />
      <DialogKonfirmasi
        terbuka={buka}
        judul={judul}
        keterangan={keterangan}
        labelYa={label}
        sedangProses={proses}
        onBatal={() => setBuka(false)}
        onYa={() =>
          mulai(async () => {
            const h = await aksi();
            setBuka(false);
            if (h.ok) {
              if (kembaliKe) router.push(kembaliKe);
              else router.refresh();
            } else {
              setPesan({ ok: false, teks: h.pesan });
            }
          })
        }
      />
    </div>
  );
}
