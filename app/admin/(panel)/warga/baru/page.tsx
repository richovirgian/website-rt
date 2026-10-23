import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { db } from "@/lib/db";
import { rumahUntukPilihan } from "@/lib/warga";
import { kodeRumah } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormWarga } from "@/components/cms/form-warga";
import { FormWargaManual } from "@/components/cms/form-warga-manual";
import { LABEL_HUNIAN } from "@/lib/warga-label";
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
    const daftar = await rumahUntukPilihan();
    const pilihan = daftar.map((r) => ({
      id: r.id,
      kode: kodeRumah(r),
      keluarga: r.keluarga.map((x) => ({
        id: x.id,
        label: `Keluarga ${x.anggota[0]?.namaLengkap ?? "(kepala belum diisi)"} · ${LABEL_HUNIAN[x.statusHunian]} · ${x._count.anggota} anggota`,
      })),
    }));
    return (
      <div className="max-w-3xl">
        <Link href="/admin/warga" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Semua warga
        </Link>
        <JudulHalaman judul="Tambah warga" keterangan="Isi manual satu per satu. Untuk banyak data sekaligus, pakai Impor CSV di halaman Warga." />
        {pilihan.length === 0 ? (
          <div className={KARTU}>
            <p className="leading-relaxed text-hijau-tua/85">Belum ada rumah. Tambahkan rumah lebih dulu, baru warganya.</p>
            <Link href="/admin/rumah" className={`${TOMBOL_UTAMA} mt-5`}>Buka daftar rumah</Link>
          </div>
        ) : (
          <div className={KARTU}>
            <FormWargaManual rumah={pilihan} />
          </div>
        )}
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
