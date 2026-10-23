import type { Metadata } from "next";
import Link from "next/link";
import { Download, Upload } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarWarga, nomorHalaman, PER_HALAMAN } from "@/lib/warga";
import { DOMISILI, kodeRumah, LABEL_DOMISILI, LABEL_HUBUNGAN } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { KotakCari } from "@/components/cms/kotak-cari";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
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
        keterangan="Data warga di seluruh rumah. Tambah anggota lewat halaman rumah masing-masing."
        aksi={
          <>
            {punya(s.peran, "residents.export") && (
              <a href="/api/warga/ekspor" className={TOMBOL_SEKUNDER}>
                <Download className="size-4" aria-hidden="true" />
                Ekspor CSV
              </a>
            )}
            {punya(s.peran, "residents.create") && (
              <Link href="/admin/warga/impor" className={TOMBOL_UTAMA}>
                <Upload className="size-4" aria-hidden="true" />
                Impor CSV
              </Link>
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
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-krem-2 text-xs uppercase tracking-wider text-muted-fg">
              <tr>
                <th scope="col" className="px-4 py-3">Nama</th>
                <th scope="col" className="px-4 py-3">Rumah</th>
                <th scope="col" className="px-4 py-3">Hubungan</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {baris.map((w) => (
                <tr key={w.id} className="hover:bg-krem-2/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/warga/${w.id}`} className="font-semibold text-hijau underline-offset-4 hover:underline">
                      {w.namaLengkap}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/rumah/${w.keluarga.rumah.id}`} className="text-hijau-tua underline-offset-4 hover:underline">
                      {kodeRumah(w.keluarga.rumah)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-fg">{LABEL_HUBUNGAN[w.hubungan]}</td>
                  <td className="px-4 py-3">
                    <Lencana nada={w.statusDomisili === "AKTIF" ? "hijau" : "abu"}>{LABEL_DOMISILI[w.statusDomisili]}</Lencana>
                  </td>
                  <td className="px-4 py-3">{w.userId ? <Lencana nada="jingga">Punya akun</Lencana> : <span className="text-muted-fg">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Paginasi jalur="/admin/warga" halaman={nomor} total={total} perHalaman={PER_HALAMAN} params={{ q, status }} />
    </div>
  );
}
