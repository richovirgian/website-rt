"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { HasilAksi } from "@/lib/aksi";

/**
 * Menjalankan server action dari formulir: status proses, galat per isian,
 * dan pesan ringkas. Setelah berhasil, halaman dimuat ulang supaya data
 * server yang tampil ikut segar.
 */
export function useAksi() {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);

  function jalankan(
    fn: () => Promise<HasilAksi>,
    opsi: {
      berhasil?: string;
      ke?: (id?: string) => string;
      selesai?: () => void;
    } = {},
  ) {
    setPesan(null);
    setGalat({});
    mulai(async () => {
      const h = await fn();
      if (h.ok) {
        setPesan({ ok: true, teks: opsi.berhasil ?? "Tersimpan." });
        opsi.selesai?.();
        if (opsi.ke) router.push(opsi.ke(h.id));
        else router.refresh();
      } else {
        setGalat(h.galat ?? {});
        setPesan({ ok: false, teks: h.pesan });
      }
    });
  }

  return { proses, galat, pesan, jalankan };
}
