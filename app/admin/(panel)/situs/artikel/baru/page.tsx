import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { hariIni } from "@/lib/uang";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormArtikel } from "@/components/cms/form-situs";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tulis artikel" };

export default async function HalamanArtikelBaru() {
  const s = await wajibIzin("content.manage");
  return (
    <div className="max-w-3xl">
      <Link href="/admin/situs/artikel" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua artikel
      </Link>
      <JudulHalaman judul="Tulis artikel" />
      <div className={KARTU}><FormArtikel penulisAwal={s.user.name} tanggalAwal={hariIni()} /></div>
    </div>
  );
}
