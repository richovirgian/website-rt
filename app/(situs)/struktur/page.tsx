import type { Metadata } from "next";
import { INTI, KETUA, SEKSI } from "@/lib/profil";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { JudulSeksi } from "@/components/site/judul-seksi";
import { KartuPengurus } from "@/components/site/kartu-pengurus";

export const metadata: Metadata = {
  title: "Struktur pengurus",
  description: "Susunan pengurus RT beserta tugasnya.",
};

/** Garis penghubung antartingkat bagan. Hanya dekorasi, hanya di layar lebar. */
function Penghubung() {
  return (
    <div aria-hidden="true" className="mx-auto hidden h-10 w-0.5 bg-hijau/25 md:block" />
  );
}

export default function HalamanStruktur() {
  return (
    <>
      <PageHero
        eyebrow="Struktur"
        judul="Susunan pengurus"
        deskripsi="Pengurus dipilih warga lewat musyawarah dan bekerja secara sukarela. Setiap jabatan punya tugas yang jelas."
      />

      <section aria-labelledby="judul-bagan" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <h2 id="judul-bagan" className="sr-only">
          Bagan struktur pengurus
        </h2>

        <Reveal className="mx-auto max-w-sm">
          <KartuPengurus p={KETUA} utama />
        </Reveal>

        <Penghubung />

        <ul className="mt-6 grid gap-5 md:mt-0 md:grid-cols-3">
          {INTI.map((p, i) => (
            <Reveal as="li" key={p.jabatan} delay={i * 100}>
              <KartuPengurus p={p} />
            </Reveal>
          ))}
        </ul>
      </section>

      <section aria-labelledby="judul-seksi" className="border-t border-hijau/10 bg-krem-2 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <JudulSeksi
              eyebrow="Seksi-seksi"
              judul="Koordinator bidang"
              deskripsi="Setiap bidang dikoordinasi satu orang, dibantu warga yang bersedia."
              id="judul-seksi"
            />
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SEKSI.map((p, i) => (
              <Reveal as="li" key={p.jabatan} delay={i * 90}>
                <KartuPengurus p={p} />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
