import type { Metadata } from "next";
import Link from "next/link";
import { AGENDA, KEGIATAN_RUTIN, formatTanggal } from "@/lib/profil";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { JudulSeksi } from "@/components/site/judul-seksi";

export const metadata: Metadata = {
  title: "Kegiatan",
  description: "Agenda kegiatan mendatang dan kegiatan rutin warga.",
};

export default function HalamanKegiatan() {
  const hariIni = new Date().toISOString().slice(0, 10);
  const mendatang = AGENDA.filter((a) => a.tanggal >= hariIni);

  return (
    <>
      <PageHero
        eyebrow="Kegiatan"
        judul="Ada banyak cara untuk saling mengenal"
        deskripsi="Dari kerja bakti sampai pentas seni, semua warga diundang ikut serta."
      />

      <section aria-labelledby="judul-agenda" className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
        <Reveal>
          <JudulSeksi eyebrow="Agenda" judul="Yang akan datang" id="judul-agenda" />
        </Reveal>

        {mendatang.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-hijau/10 bg-krem-2/60 p-6 text-hijau-tua/80">
            Belum ada agenda terdekat. Pantau terus halaman ini.
          </p>
        ) : (
          <ol className="mt-10 flex flex-col gap-5">
            {mendatang.map((a, i) => {
              const hari = a.tanggal.split("-")[2];
              const bulan = new Date(`${a.tanggal}T00:00:00+07:00`).toLocaleDateString("id-ID", {
                month: "short",
                timeZone: "Asia/Jakarta",
              });
              return (
                <Reveal as="li" key={a.judul} delay={i * 90} className="flex gap-5 rounded-2xl border border-hijau/10 bg-krem-2/60 p-5 sm:p-6">
                  <div aria-hidden="true" className="grid size-20 shrink-0 place-items-center rounded-2xl bg-hijau text-center text-krem">
                    <div>
                      <p className="text-3xl font-bold leading-none">{hari}</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-jingga">{bulan}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-hijau">{a.judul}</h3>
                    <p className="mt-1 text-sm font-medium text-hijau-tua/70">
                      {formatTanggal(a.tanggal)} · {a.waktu}
                    </p>
                    <p className="text-sm text-hijau-tua/70">{a.tempat}</p>
                    <p className="mt-3 leading-relaxed text-hijau-tua/85">{a.isi}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="judul-rutin" className="border-t border-hijau/10 bg-krem-2 py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal>
            <JudulSeksi eyebrow="Kegiatan rutin" judul="Yang kami lakukan bersama" id="judul-rutin" />
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {KEGIATAN_RUTIN.map(({ ikon: Ikon, judul, waktu, isi }, i) => (
              <Reveal as="li" key={judul} delay={i * 90} className="rounded-2xl border border-hijau/10 bg-krem p-6">
                <span className="grid size-12 place-items-center rounded-xl bg-hijau text-krem">
                  <Ikon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-hijau">{judul}</h3>
                <p className="mt-1 text-sm font-semibold text-jingga">{waktu}</p>
                <p className="mt-2 leading-relaxed text-hijau-tua/80">{isi}</p>
              </Reveal>
            ))}
          </ul>
          <Reveal className="mt-10">
            <Link
              href="/galeri"
              className="font-semibold text-hijau underline decoration-jingga decoration-2 underline-offset-4 hover:text-hijau-tua"
            >
              Lihat dokumentasi kegiatan di galeri
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
