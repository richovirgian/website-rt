import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { jenisSuratAktif } from "@/lib/komunikasi-kueri";
import { JENIS_SURAT_BAWAAN } from "@/lib/surat";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormAjukanSurat } from "@/components/cms/form-surat";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ajukan surat" };

export default async function HalamanAjukanSurat() {
  await wajibIzin("letters.request.own");
  // Bila Admin belum menyiapkan jenis surat, sediakan dua jenis bawaan (aman dari balapan: nama dan kode unik).
  if ((await db().jenisSurat.count()) === 0) {
    await db().jenisSurat.createMany({ data: JENIS_SURAT_BAWAAN.map((j) => ({ ...j })), skipDuplicates: true });
  }
  const jenis = await jenisSuratAktif();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/surat" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Surat saya
      </Link>
      <JudulHalaman judul="Ajukan surat" keterangan="Pengurus akan memeriksa pengajuan Anda. Anda diberi tahu lewat notifikasi." />
      <div className={KARTU}>
        {jenis.length === 0 ? <p className="text-sm text-muted-fg">Belum ada jenis surat yang tersedia. Hubungi pengurus.</p> : <FormAjukanSurat jenis={jenis} />}
      </div>
    </div>
  );
}
