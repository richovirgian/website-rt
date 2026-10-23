import type { Metadata } from "next";
import { GALERI } from "@/lib/profil";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { UbinGaleri } from "@/components/site/ubin-galeri";

export const metadata: Metadata = {
  title: "Galeri",
  description: "Dokumentasi kegiatan dan suasana lingkungan.",
};

export default function HalamanGaleri() {
  return (
    <>
      <PageHero
        eyebrow="Galeri"
        judul="Potret kebersamaan"
        deskripsi="Dokumentasi kegiatan dan suasana sehari-hari di lingkungan kami."
      />

      <section aria-label="Foto" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <ul className="grid auto-rows-[13rem] grid-cols-2 gap-4 lg:grid-cols-4">
          {GALERI.map((f, i) => (
            <Reveal
              as="li"
              key={f.judul}
              delay={(i % 4) * 70}
              className={
                i === 0
                  ? "col-span-2 row-span-2"
                  : i === 6
                    ? "lg:col-span-2"
                    : i === 7
                      ? "col-span-2 lg:col-span-1"
                      : ""
              }
            >
              <UbinGaleri f={f} className="h-full" />
            </Reveal>
          ))}
        </ul>
      </section>
    </>
  );
}
