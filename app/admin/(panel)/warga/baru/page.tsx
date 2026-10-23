import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { db } from "@/lib/db";
import { kodeRumah } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormWarga } from "@/components/cms/form-warga";
import { KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tambah warga" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanWargaBaru({
  searchParams,
}: {
  searchParams: Promise<{ keluarga?: string }>;
}) {
  await wajibIzin("residents.create");
  const { keluarga } = await searchParams;

  const k =
    keluarga && UUID.test(keluarga)
      ? await db().keluarga.findUnique({
          where: { id: keluarga },
          select: { id: true, rumah: { select: { id: true, blok: true, nomor: true } } },
        })
      : null;

  if (!k) {
    return (
      <div className="max-w-2xl">
        <JudulHalaman judul="Tambah warga" />
        <div className={KARTU}>
          <p className="leading-relaxed text-hijau-tua/85">
            Warga ditambahkan ke sebuah keluarga. Buka halaman rumahnya, lalu
            pilih <strong>Tambah anggota</strong> pada keluarga yang sesuai.
            Belum ada keluarganya? Tambahkan keluarga di halaman rumah itu lebih dulu.
          </p>
          <Link href="/admin/rumah" className={`${TOMBOL_UTAMA} mt-5`}>
            Buka daftar rumah
          </Link>
        </div>
      </div>
    );
  }

  const kembali = `/admin/rumah/${k.rumah.id}`;
  return (
    <div className="max-w-3xl">
      <Link href={kembali} className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Rumah {kodeRumah(k.rumah)}
      </Link>
      <JudulHalaman judul="Tambah warga" keterangan={`Anggota baru untuk keluarga di rumah ${kodeRumah(k.rumah)}.`} />
      <div className={KARTU}>
        <FormWarga keluargaId={k.id} kembaliKe={kembali} />
      </div>
    </div>
  );
}
