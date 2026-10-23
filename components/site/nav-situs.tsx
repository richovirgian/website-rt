"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TAB_SITUS } from "@/lib/tab-situs";

const aktifPada = (jalur: string, href: string) =>
  href === "/" ? jalur === "/" : jalur.startsWith(href);

/**
 * Tab navigasi situs publik. Tab aktif bergaris jingga. Di layar sempit tab
 * ditaruh di panel yang dibuka tombol menu; panel menutup saat tautan dipilih
 * atau Escape ditekan.
 */
export function NavSitus() {
  const jalur = usePathname();
  const [buka, setBuka] = useState(false);

  useEffect(() => {
    if (!buka) return;
    const tutup = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [buka]);

  return (
    <>
      <nav aria-label="Utama" className="hidden items-center gap-0.5 lg:flex">
        {TAB_SITUS.map((t) => {
          const aktif = aktifPada(jalur, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={aktif ? "page" : undefined}
              className={cn(
                "relative px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau",
                aktif ? "text-hijau" : "text-hijau-tua/70 hover:text-hijau",
              )}
            >
              {t.label}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 -bottom-0.5 h-0.5 origin-left rounded-full bg-jingga transition-transform duration-300",
                  aktif ? "scale-x-100" : "scale-x-0",
                )}
              />
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        aria-controls="menu-situs"
        aria-label={buka ? "Tutup menu" : "Buka menu"}
        className="grid size-10 place-items-center rounded-lg border border-hijau/20 text-hijau lg:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau"
      >
        {buka ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {buka && (
        <nav
          id="menu-situs"
          aria-label="Menu seluler"
          className="menu-turun absolute inset-x-0 top-full border-b border-hijau/10 bg-krem px-5 pb-5 pt-2 shadow-lg lg:hidden"
        >
          <ul className="flex flex-col">
            {TAB_SITUS.map((t, i) => {
              const aktif = aktifPada(jalur, t.href);
              return (
                <li
                  key={t.href}
                  className="menu-butir"
                  style={{ animationDelay: `${60 + i * 40}ms` }}
                >
                  <Link
                    href={t.href}
                    onClick={() => setBuka(false)}
                    aria-current={aktif ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between border-b border-hijau/10 py-3.5 text-base font-medium",
                      aktif ? "text-hijau" : "text-hijau-tua/80",
                    )}
                  >
                    {t.label}
                    {aktif && (
                      <span className="size-2 rounded-full bg-jingga" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/masuk"
            onClick={() => setBuka(false)}
            className="mt-4 flex h-12 items-center justify-center rounded-lg bg-hijau text-base font-semibold text-krem"
          >
            Masuk
          </Link>
        </nav>
      )}
    </>
  );
}
