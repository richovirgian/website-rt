import { cn } from "@/lib/utils";

/** Judul seksi: penanda kecil, judul besar, dan deskripsi opsional. */
export function JudulSeksi({
  eyebrow,
  judul,
  deskripsi,
  id,
  tengah = false,
  className,
}: {
  eyebrow: string;
  judul: string;
  deskripsi?: string;
  id?: string;
  tengah?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(tengah && "mx-auto text-center", "max-w-2xl", className)}>
      <p
        className={cn(
          "inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-hijau",
        )}
      >
        <span className="size-2 rounded-full bg-jingga" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mt-3 text-3xl font-bold leading-tight tracking-tight text-hijau sm:text-4xl"
      >
        {judul}
      </h2>
      {deskripsi && (
        <p className="mt-3 text-lg leading-relaxed text-hijau-tua/80">{deskripsi}</p>
      )}
    </div>
  );
}
