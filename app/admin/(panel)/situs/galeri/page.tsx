import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { hapusFoto } from "@/lib/cms/aksi-situs";
import { bendera } from "@/lib/situs";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { BannerBawaan } from "@/components/cms/banner-bawaan";
import { FormTambahFoto, FormUbahFoto } from "@/components/cms/form-situs";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { KARTU, TOMBOL_SEKUNDER } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Galeri situs" };

export default async function HalamanGaleriSitus() {
  await wajibIzin("content.manage");
  const [b, foto] = await Promise.all([
    bendera(),
    db().fotoGaleri.findMany({ orderBy: [{ urutan: "asc" }, { dibuatPada: "desc" }], select: { id: true, gambarId: true, judul: true, keterangan: true, urutan: true } }),
  ]);

  return (
    <div className="max-w-5xl">
      <JudulHalaman judul="Galeri situs" keterangan="Tambah dan atur foto yang tampil di galeri situs publik." />
      {!b.galeri && (
        <BannerBawaan>
          Galeri situs publik sekarang menampilkan <strong>ubin contoh bawaan</strong> (tanpa foto asli). Begitu Anda menambah foto pertama, situs hanya menampilkan foto Anda.
        </BannerBawaan>
      )}

      <details className={`${KARTU} group mb-8`} open={foto.length === 0}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
          <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
          Tambah foto
        </summary>
        <div className="mt-5 max-w-2xl"><FormTambahFoto /></div>
      </details>

      {foto.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada foto di galeri Anda.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {foto.map((f) => (
            <li key={f.id} className={`${KARTU} flex flex-col gap-4`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${f.gambarId}`} alt={f.judul} loading="lazy" className="aspect-[4/3] w-full rounded-xl border border-line object-cover" />
              <div>
                <p className="font-semibold text-hijau">{f.judul}</p>
                {f.keterangan && <p className="text-sm text-muted-fg">{f.keterangan}</p>}
              </div>
              <details className="group">
                <summary className="cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden"><span className={TOMBOL_SEKUNDER}>Ubah</span></summary>
                <div className="mt-4 flex flex-col gap-5">
                  <FormUbahFoto foto={f} />
                  <TombolHapus label="Hapus foto" judul="Hapus foto ini?" keterangan={`"${f.judul}" dihapus permanen dari galeri.`} aksi={hapusFoto.bind(null, f.id)} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
