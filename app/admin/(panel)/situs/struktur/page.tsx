import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { hapusPengurus } from "@/lib/cms/aksi-situs";
import { bendera } from "@/lib/situs";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { BannerBawaan } from "@/components/cms/banner-bawaan";
import { FormPengurus, TombolContoh } from "@/components/cms/form-situs";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { KARTU, TOMBOL_SEKUNDER } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Struktur pengurus situs" };

const GRUP = [
  { tingkat: "KETUA", judul: "Ketua RT", ket: "Satu orang." },
  { tingkat: "INTI", judul: "Pengurus inti", ket: "Wakil, sekretaris, bendahara, dan sejenisnya." },
  { tingkat: "SEKSI", judul: "Koordinator seksi", ket: "Keamanan, kebersihan, sosial, humas, dan sejenisnya." },
] as const;

export default async function HalamanStrukturSitus() {
  await wajibIzin("content.manage");
  const [b, semua] = await Promise.all([bendera(), db().pengurusSitus.findMany({ orderBy: [{ urutan: "asc" }, { jabatan: "asc" }] })]);

  return (
    <div className="max-w-4xl">
      <JudulHalaman judul="Struktur pengurus" keterangan="Ganti nama, jabatan, dan tugas pengurus yang tampil di halaman Struktur situs publik." />
      {!b.struktur ? (
        <>
          <BannerBawaan>
            Situs publik sekarang menampilkan <strong>susunan pengurus contoh</strong> (&quot;Nama Ketua RT&quot; dan seterusnya). Salin dulu susunannya ke sini, lalu ganti dengan nama yang sebenarnya.
          </BannerBawaan>
          <TombolContoh jenis="struktur" label="Salin susunan pengurus untuk disunting" />
        </>
      ) : (
        <div className="flex flex-col gap-10">
          {GRUP.map((g) => {
            const isi = semua.filter((p) => p.tingkat === g.tingkat);
            return (
              <section key={g.tingkat} aria-labelledby={`g-${g.tingkat}`}>
                <h2 id={`g-${g.tingkat}`} className="text-lg font-bold text-hijau">{g.judul}</h2>
                <p className="mb-4 text-sm text-muted-fg">{g.ket}</p>
                <ul className="flex flex-col gap-4">
                  {isi.map((p) => (
                    <li key={p.id} className={KARTU}>
                      <p className="text-sm text-muted-fg">{p.jabatan}</p>
                      <p className="text-lg font-semibold text-hijau">{p.nama}</p>
                      <details className="group mt-3">
                        <summary className="cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden"><span className={TOMBOL_SEKUNDER}>Ubah</span></summary>
                        <div className="mt-4 flex flex-col gap-5">
                          <FormPengurus tingkat={p.tingkat} pengurus={p} />
                          <TombolHapus label="Hapus" judul="Hapus pengurus ini?" keterangan={`${p.jabatan} (${p.nama}) dihapus dari struktur.`} aksi={hapusPengurus.bind(null, p.id)} />
                        </div>
                      </details>
                    </li>
                  ))}
                  {isi.length === 0 && <li className={`${KARTU} text-sm text-muted-fg`}>Belum ada.</li>}
                </ul>
                {(g.tingkat !== "KETUA" || isi.length === 0) && (
                  <details className={`${KARTU} group mt-4`}>
                    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
                      <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
                      Tambah {g.judul.toLowerCase()}
                    </summary>
                    <div className="mt-5"><FormPengurus tingkat={g.tingkat} /></div>
                  </details>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
