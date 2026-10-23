import Link from "next/link";
import { LogoLencana } from "@/components/site/logo";
import { TAB_SITUS } from "@/lib/tab-situs";
import type { PengaturanRt } from "@/lib/pengaturan";
import { JAM_LAYANAN, SLOGAN } from "@/lib/profil";

export function SiteFooter({ rt }: { rt: PengaturanRt }) {
  return (
    <footer className="border-t border-hijau/10 bg-hijau text-krem">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          <div className="flex items-center gap-3">
            <LogoLencana ukuran="size-12" />
            <p className="text-lg font-semibold">{rt.namaRt}</p>
          </div>
          <p className="mt-4 max-w-sm leading-relaxed text-krem/75">
            {SLOGAN}
          </p>
        </div>

        <nav aria-label="Pintasan">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-jingga">
            Halaman
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {TAB_SITUS.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className="text-krem/80 transition-colors hover:text-krem hover:underline"
                >
                  {t.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/masuk"
                className="text-krem/80 transition-colors hover:text-krem hover:underline"
              >
                Masuk
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-jingga">
            Kontak
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-krem/80">
            {rt.alamat && <li>{rt.alamat}</li>}
            <li>{rt.kontak || "Hubungi pengurus RT."}</li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-jingga">
            Jam layanan pengurus
          </h2>
          <ul className="mt-4 flex flex-col gap-2.5 text-krem/80">
            {JAM_LAYANAN.map((j) => (
              <li key={j.hari}>
                <span className="block text-krem">{j.hari}</span>
                {j.jam}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-krem/15">
        <p className="mx-auto max-w-6xl px-5 py-5 text-sm text-krem/60">
          © {new Date().getFullYear()} {rt.namaRt}
        </p>
      </div>
    </footer>
  );
}
