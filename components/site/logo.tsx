import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Lencana logo. Berkas aslinya persegi berlatar krem dengan lingkaran hijau
 * di tengah (sekitar 72% lebarnya). Di sini dipotong bulat dan diperbesar
 * sedikit supaya yang tampak hanya lingkarannya, jadi bisa dipasang di latar
 * gelap maupun terang tanpa kotak krem di sekelilingnya.
 */
export function LogoLencana({
  ukuran = "size-10",
  className,
  label = "",
}: {
  ukuran?: string;
  className?: string;
  /** Teks alternatif. Kosongkan bila namanya sudah tertulis di sebelahnya. */
  label?: string;
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full",
        ukuran,
        className,
      )}
    >
      <Image
        src="/logo.png"
        alt={label}
        fill
        sizes="384px"
        className="scale-[1.38] object-cover"
        priority
      />
    </span>
  );
}

/** Lencana dengan nama, untuk panel dan halaman masuk (latar gelap). */
export function Logo({
  nama,
  className,
  ringkas = false,
}: {
  nama: string;
  className?: string;
  ringkas?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoLencana ukuran={ringkas ? "size-9" : "size-11"} />
      <span
        className={cn(
          "font-semibold leading-tight text-white",
          ringkas ? "text-sm" : "text-lg",
        )}
      >
        {nama}
      </span>
    </span>
  );
}
