import Link from "next/link";
import { wajibMasuk, peranPengguna } from "@/lib/cms/sesi";
import { INFO_PERAN, punya } from "@/lib/izin";
import { MENU } from "@/lib/menu";
import { pengaturanRt } from "@/lib/pengaturan";
import { Logo } from "@/components/site/logo";
import { TombolKeluar } from "@/components/cms/tombol-keluar";
import { NavAdmin } from "@/components/cms/nav-admin";
import { BilahBawah } from "@/components/cms/bilah-bawah";
import { LoncengNotifikasi } from "@/components/cms/lonceng-notifikasi";
import { jumlahNotifikasiBelumDibaca } from "@/lib/komunikasi-kueri";

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
  const belumDibaca = await jumlahNotifikasiBelumDibaca(s.user.id);

  const menu = MENU.filter((m) => m.izin === null || punya(peran, m.izin));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-line bg-surface print:hidden lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-4 p-4 lg:gap-6 lg:p-5">
          <div className="flex items-center justify-between gap-3">
            <Link href="/admin" className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hijau">
              <Logo nama={rt.namaRt} ringkas />
            </Link>
            <div className="flex items-center gap-1">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider lg:hidden ${badge.kelas}`}>
                {badge.nama}
              </span>
              <LoncengNotifikasi jumlah={belumDibaca} />
            </div>
          </div>

          {/* Layar lebar: menu samping. Ponsel memakai bilah navigasi bawah. */}
          <div className="hidden lg:block">
            <NavAdmin menu={menu} />
          </div>

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
        </div>
      </aside>

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-8 sm:pt-10 lg:pb-10 print:p-0">{children}</main>

      <BilahBawah menu={menu} nama={s.user.name} peran={badge.nama} />
    </div>
  );
}
