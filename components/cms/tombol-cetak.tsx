"use client";

import { Printer } from "lucide-react";
import { TOMBOL_SEKUNDER } from "@/components/cms/gaya";

/** Membuka dialog cetak peramban; dari sana bisa dicetak atau disimpan sebagai PDF. */
export function TombolCetak() {
  return (
    <button type="button" onClick={() => window.print()} className={`${TOMBOL_SEKUNDER} print:hidden`}>
      <Printer className="size-4" aria-hidden="true" />
      Cetak atau simpan PDF
    </button>
  );
}
