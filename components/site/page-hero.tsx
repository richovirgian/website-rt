import { Arcs } from "@/components/site/decor";

/** Kepala halaman dalam: judul besar di atas latar lingkaran yang memuai. */
export function PageHero({
  eyebrow,
  judul,
  deskripsi,
}: {
  eyebrow: string;
  judul: string;
  deskripsi: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-hijau/10 bg-krem-2">
      <Arcs className="fade-slow text-hijau/15" />
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <p className="rise inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-hijau">
          <span className="size-2 rounded-full bg-jingga" aria-hidden="true" />
          {eyebrow}
        </p>
        <h1
          className="rise mt-3 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-hijau sm:text-5xl"
          style={{ animationDelay: "80ms" }}
        >
          {judul}
        </h1>
        <p
          className="rise mt-4 max-w-2xl text-lg leading-relaxed text-hijau-tua/80"
          style={{ animationDelay: "160ms" }}
        >
          {deskripsi}
        </p>
      </div>
    </section>
  );
}
