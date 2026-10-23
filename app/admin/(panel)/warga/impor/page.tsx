import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { PanelImpor } from "@/components/cms/panel-impor";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Impor warga" };

export default async function HalamanImpor() {
  await wajibIzin("residents.create");

  return (
    <div className="max-w-3xl">
      <Link href="/admin/warga" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua warga
      </Link>
      <JudulHalaman
        judul="Impor warga dari CSV"
        keterangan="Pindahkan data dari Excel sekaligus. Berkas diperiksa dulu, dan tidak ada yang tersimpan sebelum semuanya benar."
      />

      <section className={`${KARTU} mb-6`} aria-labelledby="judul-format">
        <h2 id="judul-format" className="text-lg font-bold text-hijau">Format berkas</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-hijau-tua/85">
          <li>Kolom wajib: <code>nomor_rumah</code> dan <code>nama</code>.</li>
          <li>Kolom lain: <code>blok</code> (bawaan G), <code>kode_keluarga</code>, <code>nik</code>, <code>jenis_kelamin</code> (L/P), <code>hubungan</code>, <code>tanggal_lahir</code>, <code>tempat_lahir</code>, <code>no_hp</code>, <code>pekerjaan</code>, <code>status_hunian</code>.</li>
          <li>Baris dengan blok, nomor rumah, dan kode keluarga yang sama menjadi satu keluarga. Rumah yang belum ada dibuat otomatis.</li>
          <li>Pemisah koma atau titik koma (hasil simpan Excel) sama-sama diterima. Tanggal berformat 2000-01-31 atau 31/01/2000.</li>
        </ul>
        <a href="/template-warga.csv" download className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau underline underline-offset-4">
          <Download className="size-4" aria-hidden="true" />
          Unduh contoh berkas
        </a>
      </section>

      <PanelImpor />
    </div>
  );
}
