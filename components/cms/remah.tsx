"use client";

import { usePathname } from "next/navigation";
import { GRUP_MENU, MENU } from "@/lib/menu";

/**
 * Remah di atas judul halaman: "Bagian / Halaman". Diturunkan dari lib/menu.ts
 * menurut alamat sekarang, jadi tidak perlu diisi di tiap halaman.
 */
export function Remah() {
  const jalur = usePathname();
  const cocok = MENU.filter((m) => m.href !== "/admin" && (jalur === m.href || jalur.startsWith(`${m.href}/`))).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
  if (!cocok) return null;
  const bagian = GRUP_MENU.find((g) => g.kunci === cocok.grup)?.label;
  return (
    <p className="mb-4 hidden items-center gap-2 text-[14px] text-muted-fg lg:flex print:hidden" aria-label="Lokasi halaman">
      {bagian && (
        <>
          <span>{bagian}</span>
          <span aria-hidden="true">/</span>
        </>
      )}
      <span className="font-medium text-hijau-tua">{cocok.label}</span>
    </p>
  );
}
