import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { bendera } from "@/lib/situs";
import { LABEL_KATEGORI_ARTIKEL } from "@/lib/kategori-artikel";
import { isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { BannerBawaan } from "@/components/cms/banner-bawaan";
import { TombolContoh } from "@/components/cms/form-situs";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Artikel situs" };

export default async function HalamanArtikelSitus() {
  await wajibIzin("content.manage");
  const [b, daftar] = await Promise.all([
    bendera(),
    db().artikelSitus.findMany({ orderBy: [{ tanggal: "desc" }, { dibuatPada: "desc" }], take: 200, select: { id: true, slug: true, judul: true, kategori: true, status: true, tanggal: true } }),
  ]);

  return (
    <div className="max-w-4xl">
      <JudulHalaman
        judul="Artikel situs"
        keterangan="Tulis, sunting, dan terbitkan artikel yang tampil di situs publik."
        aksi={<Link href="/admin/situs/artikel/baru" className={TOMBOL_UTAMA}><Plus className="size-4" aria-hidden="true" />Tulis artikel</Link>}
      />
      {!b.artikel && (
        <BannerBawaan>
          Situs publik sekarang menampilkan <strong>artikel contoh bawaan</strong>. Begitu Anda menyimpan artikel pertama di sini, situs memakai artikel Anda saja.
          Atau salin dulu contoh bawaan supaya bisa disunting.
        </BannerBawaan>
      )}
      {!b.artikel && daftar.length === 0 && <div className="mb-6"><TombolContoh jenis="artikel" label="Salin artikel contoh untuk disunting" /></div>}
      {daftar.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada artikel.</p>
      ) : (
        <DaftarResponsif
          label="Daftar artikel"
          baris={daftar}
          kunci={(a) => a.id}
          kolom={[
            { judul: "Judul", utama: true, sel: (a) => <Link href={`/admin/situs/artikel/${a.id}`} className="underline-offset-4 hover:underline">{a.judul}</Link> },
            { judul: "Kategori", sel: (a) => LABEL_KATEGORI_ARTIKEL[a.kategori] },
            { judul: "Tanggal", sel: (a) => formatTanggal(isoDari(a.tanggal)) },
            { judul: "Status", sel: (a) => <Lencana nada={a.status === "TERBIT" ? "hijau" : "jingga"}>{a.status === "TERBIT" ? "Terbit" : "Draf"}</Lencana> },
          ]}
          aksi={(a) =>
            a.status === "TERBIT" && (
              <a href={`/artikel/${a.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-hijau underline-offset-4 hover:underline">
                <ExternalLink className="size-4" aria-hidden="true" />
                Lihat di situs
              </a>
            )
          }
        />
      )}
    </div>
  );
}
