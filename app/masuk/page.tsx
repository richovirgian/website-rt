import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { sesi } from "@/lib/cms/sesi";
import { pengaturanRt } from "@/lib/pengaturan";
import { siteKeyTurnstile } from "@/lib/turnstile";
import { FormMasuk } from "@/components/cms/form-masuk";
import { LogoLencana } from "@/components/site/logo";
import { Arcs, Sparkle } from "@/components/site/decor";

/**
 * Halaman masuk untuk pengurus dan warga. Dirender per permintaan karena
 * membaca sesi dan kunci Turnstile dari env saat berjalan.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk",
  robots: { index: false, follow: false },
};

export default async function HalamanMasuk() {
  // Yang sudah masuk tidak perlu melihat formulir ini lagi.
  if (await sesi()) redirect("/admin");
  const rt = await pengaturanRt();

  return (
    <div className="min-h-dvh bg-krem text-hijau-tua lg:grid lg:grid-cols-[1fr_1.1fr]">
      {/* Sisi merek */}
      <aside className="relative hidden overflow-hidden bg-hijau text-krem lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Arcs className="fade-slow text-krem/15" />
        <Sparkle className="right-[14%] top-[18%] size-8 text-jingga" delay={500} />
        <Sparkle className="bottom-[22%] left-[10%] size-6 text-krem/40" delay={2000} />

        <Link
          href="/"
          className="relative inline-flex items-center gap-3 self-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-krem"
        >
          <LogoLencana ukuran="size-12" />
          <span className="text-lg font-semibold">{rt.namaRt}</span>
        </Link>

        <div className="relative">
          <h2 className="rise max-w-md text-4xl font-bold leading-tight">
            Selamat datang kembali di portal warga.
          </h2>
          <p
            className="rise mt-4 max-w-md text-lg leading-relaxed text-krem/80"
            style={{ animationDelay: "120ms" }}
          >
            Masuk untuk mengelola urusan rumah tangga Anda, atau mengelola
            lingkungan bagi pengurus.
          </p>
        </div>

        <p className="relative flex items-center gap-2 text-sm text-krem/70">
          <ShieldCheck className="size-4 text-jingga" aria-hidden="true" />
          Akun dibuat oleh pengurus. Tidak ada pendaftaran mandiri.
        </p>
      </aside>

      {/* Sisi formulir */}
      <main className="flex min-h-dvh flex-col px-5 py-8 sm:px-10 lg:min-h-0 lg:py-12">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:text-hijau-tua focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-hijau"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke beranda
          </Link>
          <Link
            href="/"
            aria-label={`${rt.namaRt}, beranda`}
            className="lg:hidden"
          >
            <LogoLencana ukuran="size-10" />
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="rise text-3xl font-bold tracking-tight text-hijau sm:text-4xl">
            Masuk
          </h1>
          <p
            className="rise mt-2 text-lg text-hijau-tua/75"
            style={{ animationDelay: "80ms" }}
          >
            Gunakan email dan kata sandi dari pengurus.
          </p>

          <div
            className="rise mt-8 rounded-2xl border border-hijau/10 bg-krem-2/60 p-6 sm:p-8"
            style={{ animationDelay: "160ms" }}
          >
            <FormMasuk siteKey={siteKeyTurnstile()} />
          </div>

          <p
            className="rise mt-6 text-sm leading-relaxed text-hijau-tua/70"
            style={{ animationDelay: "240ms" }}
          >
            Belum punya akun atau lupa kata sandi? Hubungi pengurus RT
            {rt.kontak ? ` di ${rt.kontak}` : ""}. Pengurus akan membuatkan
            akun atau menyetel ulang kata sandi Anda.
          </p>
        </div>
      </main>
    </div>
  );
}
