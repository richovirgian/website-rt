"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, House, ScrollText, Settings, UserCog, UserRound, Users, type LucideIcon } from "lucide-react";

/**
 * Peta nama ikon di lib/menu.ts ke komponennya.
 *
 * Nama yang tidak ada di sini jatuh ke ikon Home tanpa peringatan apa pun:
 * menambah butir menu berarti menambah ikonnya di sini juga.
 */
const IKON: Record<string, LucideIcon> = {
  Home,
  House,
  Users,
  UserRound,
  UserCog,
  Settings,
  ScrollText,
};

type Butir = { href: string; label: string; ikon: string };

export function NavAdmin({ menu }: { menu: readonly Butir[] }) {
  const jalur = usePathname();

  return (
    <nav aria-label="Navigasi panel" className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
      {menu.map((m) => {
        // "/admin" hanya aktif kalau persis, selain itu semua turunannya ikut.
        const aktif =
          m.href === "/admin" ? jalur === "/admin" : jalur.startsWith(m.href);
        const Ikon = IKON[m.ikon] ?? Home;

        return (
          <Link
            key={m.href}
            href={m.href}
            aria-current={aktif ? "page" : undefined}
            className={[
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition-colors lg:gap-3",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              aktif
                ? "bg-hijau/10 font-semibold text-hijau"
                : "text-muted-fg hover:bg-hijau/[0.06] hover:text-hijau-tua",
            ].join(" ")}
          >
            <Ikon className="size-4 shrink-0" />
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
