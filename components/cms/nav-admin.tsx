"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ScrollText, Settings, UserCog, type LucideIcon } from "lucide-react";

/**
 * Peta nama ikon di lib/menu.ts ke komponennya.
 *
 * Nama yang tidak ada di sini jatuh ke ikon Home tanpa peringatan apa pun:
 * menambah butir menu berarti menambah ikonnya di sini juga.
 */
const IKON: Record<string, LucideIcon> = {
  Home,
  UserCog,
  Settings,
  ScrollText,
};

type Butir = { href: string; label: string; ikon: string };

export function NavAdmin({ menu }: { menu: readonly Butir[] }) {
  const jalur = usePathname();

  return (
    <nav aria-label="Navigasi panel" className="flex flex-col gap-1">
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
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
              aktif
                ? "bg-white/[0.08] font-medium text-white"
                : "text-muted-fg hover:bg-white/[0.04] hover:text-white",
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
