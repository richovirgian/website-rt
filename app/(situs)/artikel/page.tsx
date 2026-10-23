import type { Metadata } from "next";
import Link from "next/link";
import { KATEGORI, semuaArtikel } from "@/lib/artikel";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { KartuArtikel } from "@/components/site/kartu-artikel";

export const metadata: Metadata = {
  title: "Artikel",
  description: "Kabar, cerita, dan informasi dari lingkungan kami.",
};

export default async function HalamanArtikel({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string }>;
}) {
  const { kategori } = await searchParams;
  const aktif = KATEGORI.find((k) => k === kategori);
  const daftar = semuaArtikel().filter((a) => !aktif || a.kategori === aktif);

  const chip = (href: string, label: string, terpilih: boolean) => (
    <Link
      key={label}
      href={href}
      aria-current={terpilih ? "true" : undefined}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        terpilih
          ? "border-hijau bg-hijau text-krem"
          : "border-hijau/20 text-hijau hover:border-jingga hover:bg-jingga/10",
      )}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHero
        eyebrow="Artikel"
        judul="Kabar dan cerita dari lingkungan"
        deskripsi="Pengumuman, kegiatan, panduan, dan tips untuk hidup lebih nyaman bersama."
      />

      <section aria-label="Daftar artikel" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <nav aria-label="Saring kategori" className="flex flex-wrap gap-2">
          {chip("/artikel", "Semua", !aktif)}
          {KATEGORI.map((k) => chip(`/artikel?kategori=${k}`, k, aktif === k))}
        </nav>

        {daftar.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-hijau/10 bg-krem-2/60 p-6 text-hijau-tua/80">
            Belum ada artikel pada kategori ini.
          </p>
        ) : (
          <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {daftar.map((a, i) => (
              <Reveal as="li" key={a.slug} delay={(i % 3) * 90}>
                <KartuArtikel a={a} />
              </Reveal>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
