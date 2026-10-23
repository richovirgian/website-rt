import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-5 py-24 text-center text-white">
      <p className="text-7xl font-bold text-brand">404</p>
      <h1 className="mt-5 text-3xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-muted-fg">
        Halaman yang Anda cari mungkin sudah dipindahkan atau alamatnya keliru.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-brand px-6 text-sm font-semibold text-background transition-colors hover:bg-brand-bright"
      >
        <ArrowLeft className="size-4" />
        Kembali ke beranda
      </Link>
    </div>
  );
}
