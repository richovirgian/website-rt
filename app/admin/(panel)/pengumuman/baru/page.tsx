import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormPengumuman } from "@/components/cms/form-pengumuman";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buat pengumuman" };

export default async function HalamanPengumumanBaru() {
  await wajibIzin("announcements.manage");
  return (
    <div className="max-w-2xl">
      <Link href="/admin/pengumuman" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua pengumuman
      </Link>
      <JudulHalaman judul="Buat pengumuman" />
      <div className={KARTU}><FormPengumuman /></div>
    </div>
  );
}
