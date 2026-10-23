import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Plus, UserPlus } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailRumah } from "@/lib/warga";
import { hapusKeluarga, hapusRumah } from "@/lib/cms/aksi-rumah";
import { kodeRumah, LABEL_DOMISILI, LABEL_HUBUNGAN, LABEL_HUNIAN } from "@/lib/warga-label";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormRumah } from "@/components/cms/form-rumah";
import { FormKeluarga } from "@/components/cms/form-keluarga";
import { Lencana } from "@/components/cms/lencana";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { KARTU, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail rumah" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanDetailRumah({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await wajibIzin("residents.read");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const identitas = punya(s.peran, "residents.read_identity");
  const r = await detailRumah(id, identitas);
  if (!r) notFound();

  const boleh = punya(s.peran, "residents.update");
  const bolehBuat = punya(s.peran, "residents.create");

  return (
    <div className="max-w-5xl">
      <Link href="/admin/rumah" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua rumah
      </Link>

      <JudulHalaman
        judul={`Rumah ${kodeRumah(r)}`}
        keterangan={r.alamat ?? "Alamat belum diisi."}
      />

      {boleh && (
        <details className={`${KARTU} group mb-8`}>
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
            <Pencil className="size-4" aria-hidden="true" />
            Ubah data rumah
          </summary>
          <div className="mt-5 max-w-2xl">
            <FormRumah rumah={r} />
          </div>
        </details>
      )}

      <section aria-labelledby="judul-keluarga">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-keluarga" className="text-xl font-bold text-hijau">
            Keluarga ({r.keluarga.length})
          </h2>
        </div>

        {bolehBuat && (
          <details className={`${KARTU} group mb-5`}>
            <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
              <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
              Tambah keluarga
            </summary>
            <div className="mt-5 max-w-3xl">
              <FormKeluarga rumahId={r.id} />
            </div>
          </details>
        )}

        {r.keluarga.length === 0 ? (
          <p className={`${KARTU} text-sm text-muted-fg`}>
            Belum ada keluarga di rumah ini.
          </p>
        ) : (
          <ul className="flex flex-col gap-5">
            {r.keluarga.map((k) => {
              const kepala = k.anggota.find((a) => a.hubungan === "KEPALA_KELUARGA");
              const aktif = !k.tanggalKeluar;
              return (
                <li key={k.id} className={KARTU}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-hijau">
                        {kepala ? `Keluarga ${kepala.namaLengkap}` : "Keluarga (kepala belum diisi)"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-fg">
                        {LABEL_HUNIAN[k.statusHunian]}
                        {k.tanggalMasuk && ` · masuk ${formatTanggal(k.tanggalMasuk.toISOString().slice(0, 10))}`}
                        {k.tanggalKeluar && ` · pindah ${formatTanggal(k.tanggalKeluar.toISOString().slice(0, 10))}`}
                      </p>
                      {k.catatan && <p className="mt-1 text-sm text-hijau-tua/80">{k.catatan}</p>}
                    </div>
                    <Lencana nada={aktif ? "hijau" : "abu"}>{aktif ? "Tinggal" : "Sudah pindah"}</Lencana>
                  </div>

                  {k.anggota.length === 0 ? (
                    <p className="mt-4 text-sm text-muted-fg">Belum ada anggota.</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
                      {k.anggota.map((a) => (
                        <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                          <div>
                            <Link href={`/admin/warga/${a.id}`} className="font-semibold text-hijau underline-offset-4 hover:underline">
                              {a.namaLengkap}
                            </Link>
                            <span className="ml-2 text-sm text-muted-fg">{LABEL_HUBUNGAN[a.hubungan]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {a.userId && <Lencana nada="jingga">Punya akun</Lencana>}
                            {a.statusDomisili !== "AKTIF" && <Lencana nada="abu">{LABEL_DOMISILI[a.statusDomisili]}</Lencana>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {bolehBuat && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Link href={`/admin/warga/baru?keluarga=${k.id}`} className={TOMBOL_UTAMA}>
                        <UserPlus className="size-4" aria-hidden="true" />
                        Tambah anggota
                      </Link>
                    </div>
                  )}

                  {boleh && (
                    <details className="group mt-4 border-t border-line pt-4">
                      <summary className="cursor-pointer list-none text-sm font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
                        <span className={TOMBOL_SEKUNDER}>Ubah atau tandai pindah</span>
                      </summary>
                      <div className="mt-4 flex max-w-3xl flex-col gap-5">
                        <FormKeluarga rumahId={r.id} keluarga={k} />
                        {k.anggota.length === 0 && (
                          <TombolHapus
                            label="Hapus keluarga"
                            judul="Hapus keluarga ini?"
                            keterangan="Keluarga ini kosong dan akan dihapus permanen."
                            aksi={hapusKeluarga.bind(null, k.id)}
                          />
                        )}
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {boleh && r.keluarga.length === 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <TombolHapus
            label="Hapus rumah"
            judul="Hapus rumah ini?"
            keterangan={`Rumah ${kodeRumah(r)} belum punya keluarga dan akan dihapus permanen.`}
            aksi={hapusRumah.bind(null, r.id)}
            kembaliKe="/admin/rumah"
          />
        </section>
      )}
    </div>
  );
}
