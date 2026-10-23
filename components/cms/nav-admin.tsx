"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Home } from "lucide-react";
import { IKON_MENU } from "@/components/cms/ikon-menu";
import { kelompokkan, type KunciGrup } from "@/lib/menu";
import { cn } from "@/lib/utils";

type Butir = { href: string; label: string; ikon: string; grup: KunciGrup };

const aktifPada = (jalur: string, href: string) =>
  href === "/admin" ? jalur === "/admin" : jalur === href || jalur.startsWith(`${href}/`);

const KELAS_TAUTAN =
  "flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

/**
 * Menu samping berinduk. Induk bisa dibuka dan ditutup, dan induk yang
 * memuat halaman aktif terbuka sendiri. Induk yang hanya punya satu butir
 * tampil sebagai tautan biasa.
 */
export function NavAdmin({ menu }: { menu: readonly Butir[] }) {
  const jalur = usePathname();
  const [buka, setBuka] = useState<Record<string, boolean>>({});

  const tautan = (m: Butir, anak = false) => {
    const aktif = aktifPada(jalur, m.href);
    const Ikon = IKON_MENU[m.ikon] ?? Home;
    return (
      <Link
        key={m.href}
        href={m.href}
        aria-current={aktif ? "page" : undefined}
        className={cn(KELAS_TAUTAN, anak && "pl-11", aktif ? "bg-hijau/10 font-semibold text-hijau" : "text-muted-fg hover:bg-hijau/[0.06] hover:text-hijau-tua")}
      >
        {!anak && <Ikon className="size-4 shrink-0" aria-hidden="true" />}
        {m.label}
      </Link>
    );
  };

  return (
    <nav aria-label="Navigasi panel" className="flex flex-col gap-1">
      {kelompokkan(menu).map((g) => {
        // Tanpa label, atau hanya satu butir: tampil langsung tanpa induk.
        if (!g.label || g.butir.length === 1) return g.butir.map((m) => tautan(m));

        const Ikon = IKON_MENU[g.ikon] ?? Home;
        const adaAktif = g.butir.some((m) => aktifPada(jalur, m.href));
        const terbuka = buka[g.kunci] ?? adaAktif;
        const idDaftar = `grup-${g.kunci}`;
        return (
          <div key={g.kunci} className="flex flex-col gap-1">
            <button
              type="button"
              aria-expanded={terbuka}
              aria-controls={idDaftar}
              onClick={() => setBuka((s) => ({ ...s, [g.kunci]: !terbuka }))}
              className={cn(KELAS_TAUTAN, "w-full justify-between", adaAktif ? "font-semibold text-hijau" : "text-hijau-tua hover:bg-hijau/[0.06]")}
            >
              <span className="flex items-center gap-3">
                <Ikon className="size-4 shrink-0" aria-hidden="true" />
                {g.label}
              </span>
              <ChevronDown className={cn("size-4 shrink-0 transition-transform", terbuka && "rotate-180")} aria-hidden="true" />
            </button>
            {terbuka && (
              <div id={idDaftar} className="flex flex-col gap-0.5">
                {g.butir.map((m) => tautan(m, true))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
