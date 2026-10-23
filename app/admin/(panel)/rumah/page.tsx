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
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-krem-2 text-xs uppercase tracking-wider text-muted-fg">
              <tr>
                <th scope="col" className="px-4 py-3">Rumah</th>
                <th scope="col" className="px-4 py-3">Alamat</th>
                <th scope="col" className="px-4 py-3">Keluarga</th>
                <th scope="col" className="px-4 py-3">Penghuni aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {baris.map((r) => {
                const penghuni = r.keluarga.flatMap((k) => k.anggota);
                const kepala = penghuni.find((p) => p.hubungan === "KEPALA_KELUARGA");
                return (
                  <tr key={r.id} className="hover:bg-krem-2/50">
                    <td className="px-4 py-3">
                      <Link href={`/admin/rumah/${r.id}`} className="font-semibold text-hijau underline-offset-4 hover:underline">
                        {kodeRumah(r)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-fg">{r.alamat ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.keluarga.length === 0 ? (
                        <Lencana nada="abu">Kosong</Lencana>
                      ) : (
                        <span>{r.keluarga.length} keluarga</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {penghuni.length === 0 ? (
                        "—"
                      ) : (
                        <>
                          {kepala ? kepala.namaLengkap : penghuni[0]!.namaLengkap}
                          {penghuni.length > 1 && (
                            <span className="text-muted-fg"> +{penghuni.length - 1} orang</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Paginasi jalur="/admin/rumah" halaman={nomor} total={total} perHalaman={PER_HALAMAN} params={{ q }} />
    </div>
  );
}
