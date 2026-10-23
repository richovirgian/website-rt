import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { menitBaca } from "@/lib/artikel";
import { artikelPublik, artikelPublikBySlug } from "@/lib/situs";
import { formatTanggal } from "@/lib/profil";
import { Reveal } from "@/components/site/reveal";
import { KartuArtikel } from "@/components/site/kartu-artikel";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await artikelPublikBySlug(slug);
  return a ? { title: a.judul, description: a.ringkas } : { title: "Artikel" };
}

export default async function HalamanDetailArtikel({ params }: Props) {
  const { slug } = await params;
  const a = await artikelPublikBySlug(slug);
  if (!a) notFound();

  const lainnya = (await artikelPublik())
    .filter((x) => x.slug !== a.slug)
    .slice(0, 2);

  return (
    <>
      <article className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Link
          href="/artikel"
          className="rise inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:text-hijau-tua"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Semua artikel
        </Link>

        <header className="mt-6">
          <p className="rise inline-flex rounded-full bg-jingga/15 px-3 py-1 text-sm font-semibold text-hijau-tua">
            {a.kategori}
          </p>
          <h1
            className="rise mt-4 text-3xl font-bold leading-tight tracking-tight text-hijau sm:text-5xl"
            style={{ animationDelay: "80ms" }}
          >
            {a.judul}
          </h1>
          <p
            className="rise mt-4 text-hijau-tua/70"
            style={{ animationDelay: "160ms" }}
          >
            <time dateTime={a.tanggal}>{formatTanggal(a.tanggal)}</time> ·{" "}
            {a.penulis} · {menitBaca(a)} menit baca
          </p>
        </header>

        {a.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.cover} alt={a.judul} className="mt-8 aspect-[16/9] w-full rounded-2xl border border-hijau/10 object-cover" />
        )}

        <div className="mt-10 flex flex-col gap-8">
          <p className="text-xl leading-relaxed text-hijau-tua">{a.ringkas}</p>
          {a.isi.map((b, i) => (
            <Reveal key={i}>
              {b.judul && (
                <h2 className="mb-3 text-2xl font-bold text-hijau">{b.judul}</h2>
              )}
              <div className="flex flex-col gap-4 text-lg leading-relaxed text-hijau-tua/85">
                {b.paragraf.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </article>

      {lainnya.length > 0 && (
        <section
          aria-labelledby="judul-lainnya"
          className="border-t border-hijau/10 bg-krem-2 py-14"
        >
          <div className="mx-auto max-w-6xl px-5">
            <h2 id="judul-lainnya" className="text-2xl font-bold text-hijau">
              Baca juga
            </h2>
            <ul className="mt-6 grid gap-5 md:grid-cols-2">
              {lainnya.map((x) => (
                <li key={x.slug}>
                  <KartuArtikel a={x} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
