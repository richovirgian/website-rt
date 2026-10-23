import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarRumah, nomorHalaman, PER_HALAMAN } from "@/lib/warga";
import { kodeRumah } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { KotakCari } from "@/components/cms/kotak-cari";
import { Paginasi } from "@/components/cms/paginasi";
import { FormRumah } from "@/components/cms/form-rumah";
import { Lencana } from "@/components/cms/lencana";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rumah" };

export default async function HalamanRumah({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; halaman?: string }>;
}) {
  const s = await wajibIzin("residents.read");
  const { q, halaman } = await searchParams;
  const nomor = nomorHalaman(halaman);
  const { baris, total } = await daftarRumah({ q: q?.trim() || undefined, halaman: nomor });
  const bolehTambah = punya(s.peran, "residents.create");

  return (
    <div>
      <JudulHalaman
        judul="Rumah"
        keterangan="Daftar rumah di lingkungan beserta keluarga yang menghuninya."
      />

      {bolehTambah && (
        <details className={`${KARTU} mb-6 group`}>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
            <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
            Tambah rumah
          </summary>
          <div className="mt-5 max-w-2xl">
            <FormRumah />
          </div>
        </details>
      )}

      <KotakCari placeholder="Cari nomor rumah, alamat, atau nama penghuni" q={q} />

      {baris.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>
          {q ? "Tidak ada rumah yang cocok dengan pencarian." : "Belum ada rumah. Tambahkan rumah pertama, atau impor dari CSV di halaman Warga."}
        </p>
      ) : (
        <DaftarResponsif
          label="Daftar rumah"
          baris={baris}
          kunci={(r) => r.id}
          kolom={[
            {
              judul: "Rumah",
              utama: true,
              sel: (r) => (
                <Link href={`/admin/rumah/${r.id}`} className="underline-offset-4 hover:underline">
                  {kodeRumah(r)}
                </Link>
              ),
            },
            { judul: "Alamat", sel: (r) => <span className="text-muted-fg">{r.alamat ?? "—"}</span> },
            {
              judul: "Keluarga",
              sel: (r) => (r.keluarga.length === 0 ? <Lencana nada="abu">Kosong</Lencana> : `${r.keluarga.length} keluarga`),
            },
            {
              judul: "Penghuni aktif",
              sel: (r) => {
                const penghuni = r.keluarga.flatMap((k) => k.anggota);
                const kepala = penghuni.find((x) => x.hubungan === "KEPALA_KELUARGA");
                if (penghuni.length === 0) return "—";
                return (
                  <>
                    {kepala ? kepala.namaLengkap : penghuni[0]!.namaLengkap}
                    {penghuni.length > 1 && <span className="text-muted-fg"> +{penghuni.length - 1} orang</span>}
                  </>
                );
              },
            },
          ]}
        />
      )}

      <Paginasi jalur="/admin/rumah" halaman={nomor} total={total} perHalaman={PER_HALAMAN} params={{ q }} />
    </div>
  );
}
