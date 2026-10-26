import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { ExternalLink } from "lucide-react";
import { wajibMasuk, peranPengguna } from "@/lib/cms/sesi";
import { INFO_PERAN, punya } from "@/lib/izin";
import { MENU } from "@/lib/menu";
import { pengaturanRt } from "@/lib/pengaturan";
import { db } from "@/lib/db";
import { LogoLencana } from "@/components/site/logo";
import { TombolKeluar } from "@/components/cms/tombol-keluar";
import { NavAdmin } from "@/components/cms/nav-admin";
import { BilahBawah } from "@/components/cms/bilah-bawah";
import { LoncengNotifikasi } from "@/components/cms/lonceng-notifikasi";
import { Remah } from "@/components/cms/remah";
import { CariGlobal } from "@/components/cms/cari-global";
import { jumlahNotifikasiBelumDibaca } from "@/lib/komunikasi-kueri";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]!.toUpperCase())
    .join("") || "?";

/** Jumlah yang menunggu ditangani, untuk lencana menu. Gagal baca tidak boleh merusak panel. */
async function antrean(peran: ReturnType<typeof peranPengguna>) {
  const hasil: { href: string; badge: number }[] = [];
  try {
    if (punya(peran, "letters.read")) hasil.push({ href: "/admin/surat", badge: await db().pengajuanSurat.count({ where: { status: "DIAJUKAN" } }) });
    if (punya(peran, "complaints.read")) hasil.push({ href: "/admin/pengaduan", badge: await db().pengaduan.count({ where: { status: "BARU" } }) });
  } catch {
    return [];
  }
  return hasil;
}

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

  const bagian = await antrean(peran);

  return (
    <div className={`panel ${geist.variable} ${geistMono.variable} min-h-dvh lg:grid lg:grid-cols-[280px_1fr]`}>
      {/* Ponsel: kepala gelap. Layar lebar: menu samping. */}
      <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-[var(--side)] bg-[var(--side)] px-4 py-2 text-[var(--side-strong)] print:hidden lg:hidden">
        <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--side-accent)]">
          <LogoLencana ukuran="size-8" />
          <span className="truncate text-[15px] font-semibold">{rt.namaRt}</span>
        </Link>
        <CariGlobal menu={menu} varian="ikon" />
        <LoncengNotifikasi jumlah={belumDibaca} gelap />
      </header>

      <aside className="hidden border-r border-[var(--side-border)] bg-[var(--side)] text-[var(--side-strong)] print:hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-4 pt-5">
          <div className="flex items-center gap-2.5 px-1.5">
            <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--side-accent)]">
              <LogoLencana ukuran="size-11" />
              <span className="flex min-w-0 flex-col gap-px">
                <span className="truncate text-base font-semibold">{rt.namaRt}</span>
                <span className="truncate text-[13px] text-[var(--side-muted)]">{rt.alamat}</span>
              </span>
            </Link>
            <LoncengNotifikasi jumlah={belumDibaca} gelap />
          </div>

          <CariGlobal menu={menu} />

          <NavAdmin menu={menu} bagian={bagian} />

          <div className="mt-auto flex flex-col gap-2">
            <Link
              href="/"
              className="flex h-10 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] text-[var(--side-text)] transition-colors hover:bg-white/[0.09] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--side-accent)]"
            >
              <ExternalLink className="size-[18px]" aria-hidden="true" />
              Lihat situs publik
            </Link>
            <div className="flex items-center gap-2.5 rounded-xl border border-[var(--side-border)] bg-[var(--side-surface)] p-2.5">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-jingga text-sm font-semibold text-[#1c1917]">
                {inisial(s.user.name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{s.user.name}</span>
                <span className="truncate text-[13px] text-[var(--side-muted)]">{badge.nama} · {s.user.email}</span>
              </span>
              <TombolKeluar ikon />
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 pb-28 pt-5 sm:px-8 lg:px-12 lg:pb-12 lg:pt-6 print:p-0">
        <Remah />
        {children}
      </main>

      <BilahBawah menu={menu} nama={s.user.name} peran={badge.nama} />
    </div>
  );
}
