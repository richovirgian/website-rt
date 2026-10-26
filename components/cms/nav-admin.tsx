"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { IKON_MENU } from "@/components/cms/ikon-menu";
import { kelompokkan, type ButirMenu } from "@/lib/menu";
import { cn } from "@/lib/utils";

type Butir = Pick<ButirMenu, "href" | "label" | "ikon" | "grup">;

const aktifPada = (jalur: string, href: string) =>
  href === "/admin" ? jalur === "/admin" : jalur === href || jalur.startsWith(`${href}/`);

/**
 * Menu samping, dikelompokkan per bagian berlabel (Data, Keuangan, dst.).
 * Butir pada bagian tanpa label (Ringkasan) tampil paling atas.
 */
export function NavAdmin({ menu, bagian = [] }: { menu: readonly Butir[]; bagian?: { href: string; badge: number }[] }) {
  const jalur = usePathname();
  const badge = (href: string) => bagian.find((b) => b.href === href)?.badge ?? 0;

  return (
    <nav aria-label="Navigasi panel" className="flex shrink-0 flex-col gap-4">
      {kelompokkan(menu).map((g) => (
        <div key={g.kunci} className="flex shrink-0 flex-col gap-px" role="group" aria-label={g.label ?? "Utama"}>
          {g.label && (
            <div className="px-3 pb-2 text-xs font-medium uppercase tracking-[0.06em] text-[var(--side-muted)]">{g.label}</div>
          )}
          {g.butir.map((m) => {
            const aktif = aktifPada(jalur, m.href);
            const Ikon = IKON_MENU[m.ikon] ?? Home;
            const n = badge(m.href);
            return (
              <Link
                key={m.label}
                href={m.href}
                aria-current={aktif ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--side-accent)]",
                  aktif
                    ? "bg-[var(--side-surface)] font-semibold text-[var(--side-strong)] shadow-[0_0_0_1px_var(--side-border),0_1px_2px_rgba(0,0,0,.08)]"
                    : "text-[var(--side-text)] hover:bg-white/[0.09]",
                )}
              >
                <Ikon className="size-[19px] shrink-0" style={aktif ? { color: "var(--side-accent)" } : undefined} strokeWidth={aktif ? 1.9 : 1.8} aria-hidden="true" />
                <span className="flex-1 truncate">{m.label}</span>
                {n > 0 && (
                  <span className="font-mono-geist rounded-full bg-jingga px-1.5 text-[11px] leading-[18px] text-[#1c1917]">{n}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
