import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { semuaJenisSurat } from "@/lib/komunikasi-kueri";
import { JENIS_SURAT_BAWAAN } from "@/lib/surat";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormJenisSurat } from "@/components/cms/form-surat";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_SEKUNDER } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jenis dan templat surat" };

export default async function HalamanJenisSurat() {
  await wajibIzin("settings.manage");
  if ((await db().jenisSurat.count()) === 0) {
    await db().jenisSurat.createMany({ data: JENIS_SURAT_BAWAAN.map((j) => ({ ...j })), skipDuplicates: true });
  }
  const daftar = await semuaJenisSurat();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/surat" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Pengajuan surat
      </Link>
      <JudulHalaman judul="Jenis dan templat surat" keterangan="Mengubah templat tidak mengubah surat yang sudah disetujui: isinya disalin saat persetujuan." />

      <details className={`${KARTU} group mb-6`}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
          <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
          Tambah jenis surat
        </summary>
        <div className="mt-5"><FormJenisSurat /></div>
      </details>

      <ul className="flex flex-col gap-4">
        {daftar.map((j) => (
          <li key={j.id} className={KARTU}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-hijau">{j.nama}</h2>
                {j.deskripsi && <p className="mt-1 text-sm text-muted-fg">{j.deskripsi}</p>}
                <p className="mt-1 font-mono text-xs text-muted-fg">Kode nomor: {j.kode}</p>
              </div>
              <Lencana nada={j.aktif ? "hijau" : "abu"}>{j.aktif ? "Aktif" : "Tidak aktif"}</Lencana>
            </div>
            <details className="group mt-4 border-t border-line pt-4">
              <summary className="cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                <span className={TOMBOL_SEKUNDER}>Ubah</span>
              </summary>
              <div className="mt-5"><FormJenisSurat jenis={j} /></div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
