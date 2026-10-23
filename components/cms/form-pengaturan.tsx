"use client";

import { useState, useTransition } from "react";
import { Loader2, TriangleAlert, Check } from "lucide-react";
import { simpanPengaturanRt } from "@/lib/cms/aksi-pengaturan";
import type { PengaturanRt } from "@/lib/pengaturan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ISIAN = "h-11 border-line-strong bg-surface text-white";

const BIDANG: {
  nama: keyof PengaturanRt;
  label: string;
  bantuan?: string;
  inputMode?: "numeric";
}[] = [
  { nama: "namaRt", label: "Nama RT", bantuan: "Contoh: RT 05 Perumahan Mawar" },
  { nama: "alamat", label: "Alamat" },
  { nama: "kontak", label: "Kontak pengurus", bantuan: "Nomor telepon atau email." },
  { nama: "namaBank", label: "Nama bank" },
  {
    nama: "nomorRekening",
    label: "Nomor rekening",
    bantuan: "Rekening tujuan transfer manual. Ditampilkan ke warga saat membayar.",
    inputMode: "numeric",
  },
  { nama: "atasNamaRekening", label: "Atas nama rekening" },
];

export function FormPengaturan({ awal }: { awal: PengaturanRt }) {
  const [nilai, setNilai] = useState(awal);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [proses, mulai] = useTransition();

  function kirim(e: React.FormEvent) {
    e.preventDefault();
    setPesan(null);
    setGalat({});
    mulai(async () => {
      const h = await simpanPengaturanRt(nilai);
      if (h.ok) {
        setPesan({ ok: true, teks: "Pengaturan tersimpan." });
      } else {
        setGalat(h.galat ?? {});
        setPesan({ ok: false, teks: h.pesan });
      }
    });
  }

  return (
    <form onSubmit={kirim} className="flex max-w-xl flex-col gap-5">
      {pesan && (
        <p
          role={pesan.ok ? "status" : "alert"}
          className={
            pesan.ok
              ? "flex items-center gap-2.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3.5 py-3 text-sm text-teal-200"
              : "flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-200"
          }
        >
          {pesan.ok ? (
            <Check className="size-4 shrink-0" />
          ) : (
            <TriangleAlert className="size-4 shrink-0" />
          )}
          {pesan.teks}
        </p>
      )}

      {BIDANG.map((b) => (
        <div key={b.nama} className="flex flex-col gap-2">
          <Label htmlFor={b.nama} className="text-white">
            {b.label}
          </Label>
          <Input
            id={b.nama}
            name={b.nama}
            value={nilai[b.nama]}
            inputMode={b.inputMode}
            onChange={(e) => setNilai((n) => ({ ...n, [b.nama]: e.target.value }))}
            aria-invalid={galat[b.nama] ? true : undefined}
            aria-describedby={`${b.nama}-info`}
            className={ISIAN}
          />
          <p
            id={`${b.nama}-info`}
            className={galat[b.nama] ? "text-xs text-red-300" : "text-xs text-muted-fg"}
          >
            {galat[b.nama] ?? b.bantuan ?? ""}
          </p>
        </div>
      ))}

      <div>
        <Button type="submit" disabled={proses} className="h-11 px-6">
          {proses && <Loader2 className="animate-spin" />}
          {proses ? "Menyimpan..." : "Simpan pengaturan"}
        </Button>
      </div>
    </form>
  );
}
