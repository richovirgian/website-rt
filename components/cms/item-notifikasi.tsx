"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";
import { bukaNotifikasi, tandaiSemuaDibaca } from "@/lib/cms/aksi-notifikasi";
import { cn } from "@/lib/utils";
import { TOMBOL_SEKUNDER } from "@/components/cms/gaya";

/** Satu notifikasi. Mengkliknya menandai dibaca lalu membuka tautannya. */
export function ItemNotifikasi({
  id,
  judul,
  isi,
  waktu,
  dibaca,
}: {
  id: string;
  judul: string;
  isi: string;
  waktu: string;
  dibaca: boolean;
}) {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  return (
    <button
      type="button"
      disabled={proses}
      onClick={() =>
        mulai(async () => {
          const ke = await bukaNotifikasi(id);
          if (ke) router.push(ke);
          else router.refresh();
        })
      }
      className={cn(
        "flex min-h-16 w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors disabled:opacity-60",
        dibaca ? "border-line bg-surface hover:bg-krem-2" : "border-hijau/30 bg-hijau/5 hover:bg-hijau/10",
      )}
    >
      <span aria-hidden="true" className={cn("mt-1.5 size-2.5 shrink-0 rounded-full", dibaca ? "bg-transparent" : "bg-jingga")} />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-base text-hijau-tua", !dibaca && "font-semibold")}>
          {judul}
          {!dibaca && <span className="sr-only"> (belum dibaca)</span>}
        </span>
        <span className="mt-0.5 block text-sm leading-relaxed text-hijau-tua/80">{isi}</span>
        <span className="mt-1 block text-xs text-muted-fg">{waktu}</span>
      </span>
    </button>
  );
}

export function TombolTandaiSemua() {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  return (
    <button type="button" disabled={proses} onClick={() => mulai(async () => { await tandaiSemuaDibaca(); router.refresh(); })} className={TOMBOL_SEKUNDER}>
      <CheckCheck className="size-4" aria-hidden="true" />
      Tandai semua dibaca
    </button>
  );
}
