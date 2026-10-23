import { pengaturanRt } from "@/lib/pengaturan";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";

/**
 * Kerangka situs publik: navbar, konten, footer. Dipisah dari layout root
 * supaya panel /admin tidak ikut membawa navbar dan footer situs.
 *
 * Dirender per permintaan karena nama RT, alamat, dan kontak datang dari
 * database dan bisa diubah Admin kapan saja.
 */
export const dynamic = "force-dynamic";

export default async function SitusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rt = await pengaturanRt();

  return (
    <div className="flex min-h-dvh flex-col bg-krem text-hijau-tua">
      <a
        href="#konten"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-hijau focus:px-4 focus:py-2 focus:text-krem"
      >
        Lewati ke konten utama
      </a>
      <SiteHeader nama={rt.namaRt} />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <SiteFooter rt={rt} />
    </div>
  );
}
