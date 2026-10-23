import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormPengaduan } from "@/components/cms/form-pengaduan";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Buat pengaduan" };

export default async function HalamanPengaduanBaru() {
  await wajibIzin("complaints.create.own");
  return (
    <div className="max-w-2xl">
      <Link href="/admin/pengaduan" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Pengaduan saya
      </Link>
      <JudulHalaman judul="Buat pengaduan" keterangan="Pengurus akan menanggapi, dan Anda diberi tahu lewat notifikasi." />
      <div className={KARTU}><FormPengaduan /></div>
    </div>
  );
}
