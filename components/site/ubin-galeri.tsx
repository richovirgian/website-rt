import Image from "next/image";
import { cn } from "@/lib/utils";
import type { FotoGaleri } from "@/lib/profil";

/**
 * Ubin galeri. Bila `foto` ada, tampil sebagai gambar; bila belum, tampil
 * sebagai ubin berwarna dengan ikon, supaya galeri tidak kosong sebelum foto
 * asli dimasukkan.
 */
export function UbinGaleri({
  f,
  className,
}: {
  f: FotoGaleri;
  className?: string;
}) {
  const Ikon = f.ikon;
  return (
    <figure
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        !f.foto && cn("bg-gradient-to-br", f.latar),
        className,
      )}
    >
      {f.foto ? (
        <Image
          src={f.foto}
          alt={`${f.judul}. ${f.keterangan}`}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <Ikon
          className="absolute right-4 top-4 size-16 opacity-25 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
          aria-hidden="true"
        />
      )}
      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-hijau-tua/90 via-hijau-tua/50 to-transparent p-4 pt-10 text-krem">
        <p className="font-semibold">{f.judul}</p>
        <p className="text-sm text-krem/80">{f.keterangan}</p>
      </figcaption>
    </figure>
  );
}
