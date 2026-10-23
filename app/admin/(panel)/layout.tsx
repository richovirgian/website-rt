import Link from "next/link";
import { wajibMasuk, peranPengguna } from "@/lib/cms/sesi";
import { INFO_PERAN, punya } from "@/lib/izin";
import { MENU } from "@/lib/menu";
import { pengaturanRt } from "@/lib/pengaturan";
import { Logo } from "@/components/site/logo";
import { TombolKeluar } from "@/components/cms/tombol-keluar";
import { NavAdmin } from "@/components/cms/nav-admin";

/**
 * Shell panel, sekaligus penjaga sesi.
 *
 * Route group (panel) memisahkan bagian ini dari /masuk. Kalau penjaga
 * dipasang di layout /admin, halaman masuk ikut terjaga dan pengalihannya
 * berputar tanpa henti.
 *
 * Penjaga di sini TIDAK menggantikan penjaga di tiap halaman dan aksi tulis:
 * aksi server bisa dipanggil langsung tanpa layout ini pernah dirender.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await wajibMasuk();
  const peran = peranPengguna(s);
  const badge = INFO_PERAN[peran];
  const rt = await pengaturanRt();

  const menu = MENU.filter((m) => m.izin === null || punya(peran, m.izin));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-4 p-4 lg:gap-6 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hijau">
              <Logo nama={rt.namaRt} ringkas />
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-hijau underline-offset-4 hover:underline lg:hidden"
            >
              Lihat situs
            </Link>
          </div>

          <NavAdmin menu={menu} />

          <div className="mt-auto hidden border-t border-line pt-4 lg:block">
            <Link href="/" className="mb-4 inline-block text-sm font-semibold text-hijau underline-offset-4 hover:underline">
              Lihat situs publik
            </Link>
            <p className="truncate text-sm font-semibold text-hijau-tua">{s.user.name}</p>
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.kelas}`}
            >
              {badge.nama}
            </span>
            <p className="mt-1 truncate text-xs text-muted-fg">{s.user.email}</p>
            <TombolKeluar />
          </div>
          <div className="flex items-center justify-between border-t border-line pt-3 lg:hidden">
            <p className="min-w-0 truncate text-sm font-semibold text-hijau-tua">{s.user.name}</p>
            <TombolKeluar />
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
