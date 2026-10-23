import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatTanggal } from "@/lib/profil";
import { menitBaca, type Artikel } from "@/lib/artikel";

/** Kartu ringkasan artikel. Seluruh kartu adalah satu tautan. */
export function KartuArtikel({ a }: { a: Artikel }) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-hijau/10 bg-krem p-6 transition-all duration-300 hover:-translate-y-1 hover:border-jingga/60 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="rounded-full bg-jingga/15 px-3 py-1 font-semibold text-hijau-tua">
          {a.kategori}
        </span>
        <time dateTime={a.tanggal} className="text-hijau-tua/60">
          {formatTanggal(a.tanggal)}
        </time>
      </div>
      <h3 className="mt-4 text-xl font-semibold leading-snug text-hijau">
        <Link
          href={`/artikel/${a.slug}`}
          className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hijau"
        >
          {a.judul}
        </Link>
      </h3>
      <p className="mt-3 flex-1 leading-relaxed text-hijau-tua/80">{a.ringkas}</p>
      <p className="mt-5 flex items-center justify-between text-sm font-medium text-hijau">
        <span>
          {a.penulis} · {menitBaca(a)} menit baca
        </span>
        <ArrowUpRight
          className="size-5 text-jingga transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </p>
    </article>
  );
}
