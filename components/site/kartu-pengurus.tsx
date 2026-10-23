import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pengurus } from "@/lib/profil";

/** Kartu pengurus. Tanpa foto, avatar berupa ikon sampai fotonya tersedia. */
export function KartuPengurus({
  p,
  utama = false,
}: {
  p: Pengurus;
  utama?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center rounded-2xl border p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        utama
          ? "border-transparent bg-hijau text-krem"
          : "border-hijau/10 bg-krem hover:border-jingga/60",
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-full",
          utama ? "size-20 bg-krem text-hijau" : "size-16 bg-hijau text-krem",
        )}
      >
        <User className={utama ? "size-10" : "size-8"} aria-hidden="true" />
      </span>
      <p
        className={cn(
          "mt-4 text-sm font-semibold uppercase tracking-wider",
          utama ? "text-jingga" : "text-hijau-tua/60",
        )}
      >
        {p.jabatan}
      </p>
      <h3 className={cn("mt-1 text-xl font-bold", utama ? "text-krem" : "text-hijau")}>
        {p.nama}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-relaxed",
          utama ? "text-krem/80" : "text-hijau-tua/75",
        )}
      >
        {p.tugas}
      </p>
    </div>
  );
}
