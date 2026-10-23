import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormKegiatan } from "@/components/cms/form-kegiatan";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tambah kegiatan" };

export default async function HalamanKegiatanBaru() {
  await wajibIzin("events.manage");
  return (
    <div className="max-w-2xl">
      <Link href="/admin/kegiatan" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua kegiatan
      </Link>
      <JudulHalaman judul="Tambah kegiatan" keterangan="Semua warga diberi notifikasi saat kegiatan ditambahkan." />
      <div className={KARTU}><FormKegiatan /></div>
    </div>
  );
}
