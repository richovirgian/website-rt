"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ellipsis, Globe, Home, X } from "lucide-react";
import { IKON_MENU } from "@/components/cms/ikon-menu";
import { TombolKeluar } from "@/components/cms/tombol-keluar";
import { kelompokkan, type KunciGrup } from "@/lib/menu";
import { cn } from "@/lib/utils";

type Butir = { href: string; label: string; ikon: string; grup: KunciGrup; bawah?: number };

const aktifPada = (jalur: string, href: string) =>
  href === "/admin" ? jalur === "/admin" : jalur === href || jalur.startsWith(`${href}/`);

/**
 * Navigasi bawah untuk ponsel: empat menu utama (menurut prioritas di
 * lib/menu.ts) dan tombol "Lainnya" yang membuka lembar berisi sisanya,
 * tautan ke situs, dan tombol keluar. Mudah dijangkau ibu jari, dan area
 * sentuh tiap tombol minimal 44 piksel.
 */
export function BilahBawah({
  menu,
  nama,
  peran,
}: {
  menu: readonly Butir[];
  nama: string;
  peran: string;
}) {
  const jalur = usePathname();
  const lembar = useRef<HTMLDialogElement>(null);
  const [buka, setBuka] = useState(false);

  const utama = menu
    .filter((m) => m.bawah !== undefined)
    .sort((a, b) => a.bawah! - b.bawah!)
    .slice(0, 4);
  const sisa = menu.filter((m) => !utama.includes(m));

  useEffect(() => {
    const d = lembar.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  const sisaAktif = sisa.some((m) => aktifPada(jalur, m.href));

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden lg:hidden"
      >
        <ul className="mx-auto flex max-w-xl">
          {utama.map((m) => {
            const Ikon = IKON_MENU[m.ikon] ?? Home;
            const aktif = aktifPada(jalur, m.href);
            return (
              <li key={m.href} className="flex-1">
                <Link
                  href={m.href}
                  aria-current={aktif ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                    aktif ? "font-semibold text-[var(--side)]" : "text-muted-fg",
                  )}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", aktif && "bg-[var(--side)]/10")}>
                    <Ikon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="max-w-full truncate">{m.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setBuka(true)}
              aria-haspopup="dialog"
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium",
                sisaAktif ? "font-semibold text-[var(--side)]" : "text-muted-fg",
              )}
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", sisaAktif && "bg-[var(--side)]/10")}>
                <Ellipsis className="size-5" aria-hidden="true" />
              </span>
              Lainnya
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={lembar}
        onClose={() => setBuka(false)}
        onClick={(e) => e.target === lembar.current && setBuka(false)}
        aria-labelledby="judul-lainnya"
        className="m-0 mt-auto w-full max-w-none rounded-t-3xl border-0 bg-surface p-0 text-hijau-tua backdrop:bg-hijau-tua/40 print:hidden"
      >
        <div className="mx-auto max-w-xl px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
          <div className="flex items-center justify-between">
            <h2 id="judul-lainnya" className="text-lg font-bold text-hijau">Menu lainnya</h2>
            <button type="button" onClick={() => setBuka(false)} aria-label="Tutup menu" className="grid size-11 place-items-center rounded-full hover:bg-krem-2">
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          {kelompokkan(sisa).map((g) => (
            <section key={g.kunci} aria-label={g.label ?? "Menu"} className="mt-3">
              {g.label && <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-fg">{g.label}</h3>}
              <ul className="divide-y divide-line">
                {g.butir.map((m) => {
                  const Ikon = IKON_MENU[m.ikon] ?? Home;
                  const aktif = aktifPada(jalur, m.href);
                  return (
                    <li key={m.href}>
                      <Link href={m.href} onClick={() => setBuka(false)} aria-current={aktif ? "page" : undefined} className={cn("flex min-h-12 items-center gap-3 text-base", aktif ? "font-semibold text-hijau" : "text-hijau-tua")}>
                        <Ikon className="size-5 text-hijau" aria-hidden="true" />
                        {m.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="mt-2 border-t border-line pt-3">
            <Link href="/" onClick={() => setBuka(false)} className="flex min-h-12 items-center gap-3 text-base text-hijau-tua">
              <Globe className="size-5 text-hijau" aria-hidden="true" />
              Lihat situs publik
            </Link>
            <div className="mt-1 flex items-center justify-between gap-3 rounded-xl bg-krem-2 px-4 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{nama}</p>
                <p className="text-xs text-muted-fg">{peran}</p>
              </div>
              <TombolKeluar />
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
