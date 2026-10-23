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
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6 p-5">
          <Link href="/admin" className="shrink-0">
            <Logo nama={rt.namaRt} ringkas />
          </Link>

          <NavAdmin menu={menu} />

          <div className="mt-auto border-t border-line pt-4">
            <p className="truncate text-sm font-medium text-white">{s.user.name}</p>
            <span
              className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.kelas}`}
            >
              {badge.nama}
            </span>
            <p className="mt-1 truncate text-xs text-muted-fg">{s.user.email}</p>
            <TombolKeluar />
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 sm:py-10">{children}</main>
    </div>
  );
}
