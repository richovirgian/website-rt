import { cn } from "@/lib/utils";

/**
 * Sparkle 4 titik, berkedip pelan.
 * Penanda ruang kiri dan kanan hero. Maksimal 2 buah, hanya di layar lebar.
 */
export function Sparkle({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn("twinkle pointer-events-none absolute", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <path
        d="M50 0 C52 38 62 48 100 50 C62 52 52 62 50 100 C48 62 38 52 0 50 C38 48 48 38 50 0 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Lingkaran konsentris yang memuai keluar seperti pancaran sinyal.
 * Titik pusatnya di bawah-tengah, sejajar dengan inti cahaya horizon.
 */
export function Arcs({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 900"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full",
        className,
      )}
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        {[0, 3000, 6000].map((delay, i) => (
          <circle
            key={i}
            cx="720"
            cy="880"
            r="520"
            className="signal-ring"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Garis vertikal penanda tepi kontainer 1280px.
 * Dekorasinya terikat ke struktur layout, bukan pola latar sembarang,
 * sehingga kolom konten terbaca sampai ke area kosong di kiri dan kanan.
 */
export function ColumnGuides({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <div className="mx-auto h-full w-full max-w-[1280px] border-x border-white/[0.07]" />
    </div>
  );
}
