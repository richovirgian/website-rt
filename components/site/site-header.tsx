import Link from "next/link";
import { LogoLencana } from "@/components/site/logo";
import { NavSitus } from "@/components/site/nav-situs";

/** Navbar situs publik. Masuk dari atas saat halaman dimuat. */
export function SiteHeader({ nama }: { nama: string }) {
  return (
    <header className="drop sticky top-0 z-40 border-b border-hijau/10 bg-krem/90 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hijau"
        >
          <LogoLencana ukuran="size-10" />
          <span className="text-base font-semibold leading-tight text-hijau">
            {nama}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <NavSitus />
          <Link
            href="/masuk"
            className="hidden h-10 items-center rounded-lg bg-hijau px-5 text-sm font-semibold text-krem transition-colors hover:bg-hijau-tua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau lg:inline-flex"
          >
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
