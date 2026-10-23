import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus, Upload } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarWarga, nomorHalaman, PER_HALAMAN } from "@/lib/warga";
import { DOMISILI, kodeRumah, LABEL_DOMISILI, LABEL_HUBUNGAN } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { KotakCari } from "@/components/cms/kotak-cari";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { KARTU, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Warga" };

export default async function HalamanWarga({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; halaman?: string }>;
}) {
  const s = await wajibIzin("residents.read");
  const { q, status, halaman } = await searchParams;
  const nomor = nomorHalaman(halaman);
  const { baris, total } = await daftarWarga({ q: q?.trim() || undefined, status, halaman: nomor });

  return (
    <div>
      <JudulHalaman
        judul="Warga"
        keterangan="Data warga di seluruh rumah. Tambah manual satu per satu, atau impor banyak sekaligus dari CSV."
        aksi={
          <>
            {punya(s.peran, "residents.export") && (
              <a href="/api/warga/ekspor" className={TOMBOL_SEKUNDER}>
                <Download className="size-4" aria-hidden="true" />
                Ekspor CSV
              </a>
            )}
            {punya(s.peran, "residents.create") && (
              <>
                <Link href="/admin/warga/impor" className={TOMBOL_SEKUNDER}>
                  <Upload className="size-4" aria-hidden="true" />
                  Impor CSV
                </Link>
                <Link href="/admin/warga/baru" className={TOMBOL_UTAMA}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah warga
                </Link>
              </>
            )}
          </>
        }
      />

      <KotakCari
        placeholder="Cari nama warga"
        q={q}
        status={status}
        pilihanStatus={DOMISILI.map((d) => ({ nilai: d, label: LABEL_DOMISILI[d] }))}
      />

      {baris.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>
          {q || status ? "Tidak ada warga yang cocok." : "Belum ada data warga."}
        </p>
      ) : (
        <DaftarResponsif
          label="Daftar warga"
          baris={baris}
          kunci={(w) => w.id}
          kolom={[
            {
              judul: "Nama",
              utama: true,
              sel: (w) => (
                <Link href={`/admin/warga/${w.id}`} className="underline-offset-4 hover:underline">
                  {w.namaLengkap}
                </Link>
              ),
            },
            {
              judul: "Rumah",
              sel: (w) => (
                <Link href={`/admin/rumah/${w.keluarga.rumah.id}`} className="underline-offset-4 hover:underline">
                  {kodeRumah(w.keluarga.rumah)}
                </Link>
              ),
            },
            { judul: "Hubungan", sel: (w) => <span className="text-muted-fg">{LABEL_HUBUNGAN[w.hubungan]}</span> },
            {
              judul: "Status",
              sel: (w) => <Lencana nada={w.statusDomisili === "AKTIF" ? "hijau" : "abu"}>{LABEL_DOMISILI[w.statusDomisili]}</Lencana>,
            },
            { judul: "Akun", sel: (w) => (w.userId ? <Lencana nada="jingga">Punya akun</Lencana> : <span className="text-muted-fg">—</span>) },
          ]}
        />
      )}

      <Paginasi jalur="/admin/warga" halaman={nomor} total={total} perHalaman={PER_HALAMAN} params={{ q, status }} />
    </div>
  );
}
