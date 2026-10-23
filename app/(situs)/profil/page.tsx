import type { Metadata } from "next";
import { Compass } from "lucide-react";
import {
  FASILITAS,
  MISI,
  NILAI,
  PROFIL_PARAGRAF,
  SEJARAH,
  VISI,
  WILAYAH,
} from "@/lib/profil";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { JudulSeksi } from "@/components/site/judul-seksi";

export const metadata: Metadata = {
  title: "Profil",
  description: "Profil lingkungan: tentang kami, visi dan misi, sejarah, wilayah, dan fasilitas.",
};

export default function HalamanProfil() {
  return (
    <>
      <PageHero
        eyebrow="Profil"
        judul="Mengenal lingkungan kami"
        deskripsi="Siapa kami, apa yang kami cita-citakan, dan bagaimana lingkungan ini tumbuh."
      />

      {/* Tentang */}
      <section aria-labelledby="judul-tentang" className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <Reveal>
          <JudulSeksi eyebrow="Tentang kami" judul="Satu lingkungan, satu keluarga besar" id="judul-tentang" />
          <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-hijau-tua/80">
            {PROFIL_PARAGRAF.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Visi misi */}
      <section aria-labelledby="judul-visi" className="border-y border-hijau/10 bg-krem-2 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 lg:grid-cols-2">
          <Reveal className="rounded-3xl bg-hijau p-8 text-krem sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-jingga">Visi</p>
            <h2 id="judul-visi" className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
              {VISI}
            </h2>
          </Reveal>
          <Reveal delay={120} className="rounded-3xl border border-hijau/10 bg-krem p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-hijau-tua/60">Misi</p>
            <ol className="mt-4 flex flex-col gap-4">
              {MISI.map((m, i) => (
                <li key={m} className="flex gap-4">
                  <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-jingga text-sm font-bold text-hijau-tua">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-hijau-tua/90">{m}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Nilai */}
      <section aria-labelledby="judul-nilai" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <Reveal>
          <JudulSeksi eyebrow="Nilai" judul="Pegangan kami sehari-hari" id="judul-nilai" />
        </Reveal>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {NILAI.map(({ ikon: Ikon, judul, isi }, i) => (
            <Reveal as="li" key={judul} delay={i * 90} className="rounded-2xl border border-hijau/10 bg-krem-2/60 p-6">
              <span className="grid size-12 place-items-center rounded-xl bg-hijau text-krem">
                <Ikon className="size-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-hijau">{judul}</h3>
              <p className="mt-2 leading-relaxed text-hijau-tua/80">{isi}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Sejarah */}
      <section aria-labelledby="judul-sejarah" className="border-t border-hijau/10 bg-krem-2 py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-5">
          <Reveal>
            <JudulSeksi eyebrow="Sejarah" judul="Perjalanan lingkungan kami" id="judul-sejarah" />
          </Reveal>
          <ol className="relative mt-12 border-l-2 border-hijau/20 pl-8">
            {SEJARAH.map((s, i) => (
              <Reveal as="li" key={s.tahun} delay={i * 80} className="relative pb-10 last:pb-0">
                <span aria-hidden="true" className="absolute -left-[2.6rem] top-1 size-5 rounded-full border-4 border-krem-2 bg-jingga" />
                <p className="text-sm font-bold uppercase tracking-wider text-jingga">{s.tahun}</p>
                <h3 className="mt-1 text-xl font-semibold text-hijau">{s.judul}</h3>
                <p className="mt-2 leading-relaxed text-hijau-tua/80">{s.isi}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Wilayah */}
      <section aria-labelledby="judul-wilayah" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <Reveal>
          <JudulSeksi eyebrow="Wilayah" judul="Batas dan cakupan lingkungan" deskripsi={WILAYAH.deskripsi} id="judul-wilayah" />
        </Reveal>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WILAYAH.batas.map((b, i) => (
            <Reveal as="li" key={b.arah} delay={i * 80} className="rounded-2xl border border-hijau/10 bg-krem-2/60 p-5">
              <Compass className="size-6 text-jingga" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-hijau-tua/60">{b.arah}</p>
              <p className="mt-1 font-semibold text-hijau">{b.ket}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Fasilitas */}
      <section aria-labelledby="judul-fasilitas" className="border-t border-hijau/10 bg-krem-2 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <JudulSeksi eyebrow="Fasilitas" judul="Yang bisa dinikmati warga" id="judul-fasilitas" />
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FASILITAS.map(({ ikon: Ikon, judul, isi }, i) => (
              <Reveal as="li" key={judul} delay={(i % 3) * 90} className="flex gap-4 rounded-2xl border border-hijau/10 bg-krem p-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-jingga/20 text-hijau">
                  <Ikon className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-hijau">{judul}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-hijau-tua/75">{isi}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
