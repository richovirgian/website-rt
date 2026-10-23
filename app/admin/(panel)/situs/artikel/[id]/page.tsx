import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { hapusArtikel } from "@/lib/cms/aksi-situs";
import { hariIni, isoDari } from "@/lib/uang";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormArtikel } from "@/components/cms/form-situs";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sunting artikel" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanSuntingArtikel({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibIzin("content.manage");
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const a = await db().artikelSitus.findUnique({ where: { id } });
  if (!a) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/situs/artikel" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua artikel
      </Link>
      <JudulHalaman
        judul="Sunting artikel"
        aksi={a.status === "TERBIT" ? <a href={`/artikel/${a.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau underline-offset-4 hover:underline"><ExternalLink className="size-4" aria-hidden="true" />Lihat di situs</a> : undefined}
      />
      {a.coverId && (
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/media/${a.coverId}`} alt="Gambar sampul saat ini" className="max-h-56 w-auto max-w-full rounded-xl border border-line object-cover" />
        </div>
      )}
      <div className={`${KARTU} mb-8`}>
        <FormArtikel
          penulisAwal={s.user.name}
          tanggalAwal={hariIni()}
          artikel={{ id: a.id, judul: a.judul, kategori: a.kategori, ringkas: a.ringkas, isi: a.isi, penulis: a.penulis, tanggal: isoDari(a.tanggal), status: a.status, adaCover: !!a.coverId }}
        />
      </div>
      <TombolHapus label="Hapus artikel" judul="Hapus artikel ini?" keterangan="Artikel dan gambar sampulnya dihapus permanen dari situs." aksi={hapusArtikel.bind(null, a.id)} kembaliKe="/admin/situs/artikel" />
    </div>
  );
}
