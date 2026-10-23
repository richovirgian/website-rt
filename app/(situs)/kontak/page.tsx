import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MapPin, Phone } from "lucide-react";
import { pengaturanRt } from "@/lib/pengaturan";
import { JAM_LAYANAN } from "@/lib/profil";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Kontak",
  description: "Cara menghubungi pengurus RT dan jam layanan.",
};

export default async function HalamanKontak() {
  const rt = await pengaturanRt();

  const kartu = [
    {
      ikon: MapPin,
      judul: "Wilayah",
      isi: <p>{rt.alamat || "Belum diisi pengurus."}</p>,
    },
    {
      ikon: Phone,
      judul: "Hubungi pengurus",
      isi: <p>{rt.kontak || "Belum diisi pengurus."}</p>,
    },
    {
      ikon: Clock,
      judul: "Jam layanan pengurus",
      isi: (
        <ul className="flex flex-col gap-1.5">
          {JAM_LAYANAN.map((j) => (
            <li key={j.hari}>
              <span className="font-semibold text-hijau">{j.hari}</span>
              <br />
              {j.jam}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <>
      <PageHero
        eyebrow="Kontak"
        judul="Kami senang mendengar dari Anda"
        deskripsi="Punya pertanyaan, masukan, atau perlu bantuan? Hubungi pengurus pada jam layanan."
      />

      <section aria-label="Informasi kontak" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <ul className="grid gap-5 md:grid-cols-3">
          {kartu.map(({ ikon: Ikon, judul, isi }, i) => (
            <Reveal as="li" key={judul} delay={i * 90} className="rounded-2xl border border-hijau/10 bg-krem-2/60 p-7">
              <span className="grid size-12 place-items-center rounded-xl bg-hijau text-krem">
                <Ikon className="size-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-hijau">{judul}</h2>
              <div className="mt-2 leading-relaxed text-hijau-tua/85">{isi}</div>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl bg-hijau px-8 py-9 text-krem sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="text-2xl font-bold">Warga yang sudah punya akun?</h2>
            <p className="mt-1.5 text-krem/80">
              Masuk ke portal warga untuk urusan rumah tangga Anda.
            </p>
          </div>
          <Link
            href="/masuk"
            className="inline-flex h-12 shrink-0 items-center rounded-lg bg-jingga px-6 font-semibold text-hijau-tua transition-colors hover:bg-krem focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-krem"
          >
            Masuk portal warga
          </Link>
        </Reveal>
      </section>
    </>
  );
}
