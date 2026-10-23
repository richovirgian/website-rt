import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { pengaturanRt } from "@/lib/pengaturan";
import {
  AGENDA,
  NILAI,
  PORTAL,
  SAMBUTAN,
  SLOGAN,
  STATISTIK,
  formatTanggal,
} from "@/lib/profil";
import { artikelPublik, galeriPublik, strukturPublik } from "@/lib/situs";
import { LogoLencana } from "@/components/site/logo";
import { Arcs, Sparkle } from "@/components/site/decor";
import { Reveal } from "@/components/site/reveal";
import { CountUp } from "@/components/site/count-up";
import { JudulSeksi } from "@/components/site/judul-seksi";
import { KartuArtikel } from "@/components/site/kartu-artikel";
import { KartuPengurus } from "@/components/site/kartu-pengurus";
import { UbinGaleri } from "@/components/site/ubin-galeri";

const TOMBOL_UTAMA =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-hijau px-6 text-base font-semibold text-krem transition-colors hover:bg-hijau-tua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau";
const TAUTAN =
  "inline-flex items-center gap-2 font-semibold text-hijau underline decoration-jingga decoration-2 underline-offset-4 hover:text-hijau-tua";

export default async function Beranda() {
  const rt = await pengaturanRt();
  const hariIni = new Date().toISOString().slice(0, 10);
  const agenda = AGENDA.filter((a) => a.tanggal >= hariIni).slice(0, 3);
  const [semuaArtikel, struktur, galeri] = await Promise.all([artikelPublik(), strukturPublik(), galeriPublik()]);
  const artikel = semuaArtikel.slice(0, 3);
  const kata = ["Profil", "Struktur pengurus", "Kegiatan", "Artikel", "Galeri", "Kontak"];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Arcs className="fade-slow text-hijau/15" />
        <Sparkle className="left-[6%] top-24 hidden size-8 text-jingga lg:block" delay={600} />
        <Sparkle className="bottom-20 right-[8%] hidden size-6 text-hijau/40 lg:block" delay={2200} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="rise inline-flex items-center gap-2 rounded-full border border-jingga/40 bg-jingga/10 px-3 py-1 text-sm font-medium text-hijau-tua">
              <span className="size-2 rounded-full bg-jingga" aria-hidden="true" />
              {rt.alamat || "Profil lingkungan"}
            </p>
            <h1
              className="rise mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-hijau sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "90ms" }}
            >
              Selamat datang di {rt.namaRt}
            </h1>
            <p
              className="rise mt-5 max-w-xl text-lg leading-relaxed text-hijau-tua/80"
              style={{ animationDelay: "180ms" }}
            >
              {SLOGAN} Kenali lingkungan kami, pengurusnya, kegiatannya, dan
              kabar terbarunya.
            </p>
            <div
              className="rise mt-8 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "270ms" }}
            >
              <Link href="/profil" className={TOMBOL_UTAMA}>
                Kenali kami
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/kegiatan" className={TAUTAN}>
                Lihat kegiatan
              </Link>
            </div>
          </div>

          <div className="rise-card relative mx-auto w-full max-w-sm lg:max-w-none">
            <LogoLencana
              ukuran="size-64 sm:size-80 lg:size-96"
              className="mx-auto"
              label={`Logo ${rt.namaRt}`}
            />
          </div>
        </div>
      </section>

      {/* Pita */}
      <div aria-hidden="true" className="overflow-hidden border-y border-hijau/10 bg-hijau py-4 text-krem">
        <div className="marquee marquee-left" style={{ ["--marquee-speed" as string]: "34s" }}>
          {[0, 1].map((salinan) => (
            <ul key={salinan} className="flex shrink-0 items-center">
              {kata.map((k) => (
                <li key={k} className="flex items-center gap-6 whitespace-nowrap pr-6 text-lg font-semibold">
                  {k}
                  <span className="size-2 rounded-full bg-jingga" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      {/* Sambutan dan angka */}
      <section aria-labelledby="judul-sambutan" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal>
            <JudulSeksi eyebrow="Sambutan" judul="Rumah bersama yang kami jaga bersama" id="judul-sambutan" />
            <div className="mt-5 flex flex-col gap-4 text-lg leading-relaxed text-hijau-tua/80">
              {SAMBUTAN.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <Link href="/profil" className={`${TAUTAN} mt-6`}>
              Baca profil lengkap
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>

          <dl className="grid grid-cols-2 gap-4">
            {STATISTIK.map((s, i) => (
              <Reveal
                key={s.label}
                delay={i * 90}
                className="rounded-2xl border border-hijau/10 bg-krem-2/60 p-6"
              >
                <dd className="text-4xl font-bold text-hijau sm:text-5xl">
                  <CountUp nilai={s.nilai} akhiran={s.akhiran} />
                </dd>
                <dt className="mt-2 text-sm font-medium text-hijau-tua/70">{s.label}</dt>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Nilai */}
      <section aria-labelledby="judul-nilai" className="border-t border-hijau/10 bg-krem-2 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <JudulSeksi eyebrow="Nilai kami" judul="Yang kami pegang bersama" id="judul-nilai" />
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {NILAI.map(({ ikon: Ikon, judul, isi }, i) => (
              <Reveal
                as="li"
                key={judul}
                delay={i * 90}
                className="group rounded-2xl border border-hijau/10 bg-krem p-6 transition-all duration-300 hover:-translate-y-1 hover:border-jingga/60 hover:shadow-lg"
              >
                <span className="grid size-12 place-items-center rounded-xl bg-hijau text-krem transition-colors group-hover:bg-jingga group-hover:text-hijau-tua">
                  <Ikon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-hijau">{judul}</h3>
                <p className="mt-2 leading-relaxed text-hijau-tua/80">{isi}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Pengurus */}
      <section aria-labelledby="judul-pengurus" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <JudulSeksi eyebrow="Pengurus" judul="Orang-orang di balik lingkungan ini" id="judul-pengurus" />
          <Link href="/struktur" className={TAUTAN}>
            Lihat struktur lengkap
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...(struktur.ketua ? [struktur.ketua] : []), ...struktur.inti].map((p, i) => (
            <Reveal as="li" key={p.jabatan} delay={i * 90}>
              <KartuPengurus p={p} utama={i === 0 && !!struktur.ketua} />
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Agenda */}
      <section aria-labelledby="judul-agenda" className="border-t border-hijau/10 bg-krem-2 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <JudulSeksi eyebrow="Agenda" judul="Kegiatan yang akan datang" id="judul-agenda" />
            <Link href="/kegiatan" className={TAUTAN}>
              Semua kegiatan
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
          {agenda.length === 0 ? (
            <p className="mt-10 rounded-2xl border border-hijau/10 bg-krem p-6 text-hijau-tua/80">
              Belum ada agenda terdekat.
            </p>
          ) : (
            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {agenda.map((a, i) => {
                const hari = a.tanggal.split("-")[2];
                const namaBulan = new Date(`${a.tanggal}T00:00:00+07:00`).toLocaleDateString("id-ID", { month: "short", timeZone: "Asia/Jakarta" });
                return (
                  <Reveal as="li" key={a.judul} delay={i * 90} className="flex gap-4 rounded-2xl border border-hijau/10 bg-krem p-5">
                    <div aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-xl bg-hijau text-center text-krem">
                      <div>
                        <p className="text-2xl font-bold leading-none">{hari}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-jingga">{namaBulan}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold leading-snug text-hijau">{a.judul}</h3>
                      <p className="mt-1 text-sm text-hijau-tua/70">
                        <span className="sr-only">{formatTanggal(a.tanggal)}, </span>
                        {a.waktu}
                      </p>
                      <p className="text-sm text-hijau-tua/70">{a.tempat}</p>
                    </div>
                  </Reveal>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Artikel */}
      <section aria-labelledby="judul-artikel" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <JudulSeksi eyebrow="Artikel" judul="Kabar dan cerita terbaru" id="judul-artikel" />
          <Link href="/artikel" className={TAUTAN}>
            Semua artikel
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
        {artikel.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-hijau/10 bg-krem-2/60 p-6 text-hijau-tua/80">Belum ada artikel.</p>
        ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {artikel.map((a, i) => (
            <Reveal as="li" key={a.slug} delay={i * 90}>
              <KartuArtikel a={a} />
            </Reveal>
          ))}
        </ul>
        )}
      </section>

      {galeri.length > 0 && (
            <section aria-labelledby="judul-galeri" className="border-t border-hijau/10 bg-krem-2 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <JudulSeksi eyebrow="Galeri" judul="Potret kebersamaan kami" id="judul-galeri" />
              <Link href="/galeri" className={TAUTAN}>
                Lihat galeri
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Reveal>
            <ul className="mt-10 grid auto-rows-[11rem] grid-cols-2 gap-4 lg:grid-cols-4">
              {galeri.slice(0, 4).map((f, i) => (
                <Reveal
                  as="li"
                  key={f.judul}
                  delay={i * 70}
                  className={i === 0 ? "col-span-2 row-span-2" : i === 3 ? "col-span-2" : ""}
                >
                  <UbinGaleri f={f} className="h-full" />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Fasilitas ringkas dan portal */}
      <section className="px-5 py-16 sm:py-20">
        <Reveal className="mx-auto grid max-w-6xl gap-8 rounded-3xl bg-hijau px-8 py-10 text-krem sm:px-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-jingga">
              <Lock className="size-4" aria-hidden="true" />
              Portal warga
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
              Warga punya ruang sendiri
            </h2>
            <p className="mt-3 max-w-xl text-krem/80">
              Warga yang sudah menerima akun dari pengurus dapat masuk untuk
              urusan rumah tangganya. Fitur dibuka bertahap.
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {PORTAL.map(({ ikon: Ikon, judul }) => (
                <li key={judul} className="inline-flex items-center gap-2 rounded-full bg-krem/10 px-3.5 py-1.5 text-sm">
                  <Ikon className="size-4 text-jingga" aria-hidden="true" />
                  {judul}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:justify-self-end">
            <Link
              href="/masuk"
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-jingga px-6 text-base font-semibold text-hijau-tua transition-colors hover:bg-krem focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-krem"
            >
              Masuk portal warga
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
