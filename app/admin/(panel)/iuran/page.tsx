import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { daftarJenisIuran } from "@/lib/iuran-kueri";
import { LABEL_FREKUENSI } from "@/lib/iuran-label";
import { formatRupiah, hariIni, isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormJenisIuran } from "@/components/cms/form-jenis-iuran";
import { FormNominal } from "@/components/cms/form-nominal";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_SEKUNDER } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Iuran" };

export default async function HalamanIuran() {
  await wajibIzin("dues.manage");
  const daftar = await daftarJenisIuran();
  const hari = hariIni();

  return (
    <div className="max-w-4xl">
      <JudulHalaman
        judul="Iuran"
        keterangan="Jenis iuran dan nominalnya. Mengubah nominal menambah riwayat baru; tagihan yang sudah terbit tidak berubah."
      />

      <details className={`${KARTU} group mb-8`}>
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
          <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
          Tambah jenis iuran
        </summary>
        <div className="mt-5">
          <FormJenisIuran />
        </div>
      </details>

      {daftar.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada jenis iuran. Tambahkan yang pertama di atas.</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {daftar.map((j) => {
            const berlaku = j.aturan.find((a) => isoDari(a.berlakuMulai) <= hari);
            const mendatang = j.aturan.filter((a) => isoDari(a.berlakuMulai) > hari);
            return (
              <li key={j.id} className={KARTU}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-hijau">{j.nama}</h2>
                    {j.deskripsi && <p className="mt-1 text-sm text-muted-fg">{j.deskripsi}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Lencana nada={j.aktif ? "hijau" : "abu"}>{j.aktif ? "Aktif" : "Tidak aktif"}</Lencana>
                    <Lencana nada="abu">{LABEL_FREKUENSI[j.frekuensi]}</Lencana>
                    {j.terbitOtomatis && <Lencana nada="jingga">Terbit otomatis</Lencana>}
                  </div>
                </div>

                <p className="mt-4 text-3xl font-bold text-hijau">
                  {berlaku ? formatRupiah(berlaku.nominal) : "Belum ada nominal"}
                  {j.frekuensi === "BULANAN" && berlaku && <span className="ml-1 text-base font-medium text-muted-fg">/ bulan</span>}
                </p>
                {j.frekuensi === "BULANAN" && (
                  <p className="mt-1 text-sm text-muted-fg">Jatuh tempo tiap tanggal {j.hariJatuhTempo}.</p>
                )}
                {mendatang.length > 0 && (
                  <p className="mt-1 text-sm text-hijau-tua">
                    Berikutnya: {formatRupiah(mendatang[mendatang.length - 1]!.nominal)} mulai {formatTanggal(isoDari(mendatang[mendatang.length - 1]!.berlakuMulai))}
                  </p>
                )}

                <details className="group mt-5 border-t border-line pt-4">
                  <summary className="cursor-pointer list-none marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className={TOMBOL_SEKUNDER}>Kelola iuran ini</span>
                  </summary>
                  <div className="mt-5 flex flex-col gap-8">
                    <section aria-label={`Ubah nominal ${j.nama}`}>
                      <h3 className="mb-3 font-semibold text-hijau">Ubah nominal</h3>
                      <FormNominal jenisId={j.id} />
                      <h4 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-muted-fg">Riwayat nominal</h4>
                      <ul className="divide-y divide-line rounded-xl border border-line text-sm">
                        {j.aturan.map((a) => (
                          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                            <span className="font-semibold text-hijau-tua">{formatRupiah(a.nominal)}</span>
                            <span className="text-muted-fg">
                              mulai {formatTanggal(isoDari(a.berlakuMulai))}
                              {a.dibuatOleh && ` · oleh ${a.dibuatOleh}`}
                              {a.id === berlaku?.id && " · berlaku sekarang"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section aria-label={`Ubah data ${j.nama}`}>
                      <h3 className="mb-3 font-semibold text-hijau">Ubah data iuran</h3>
                      <FormJenisIuran
                        jenis={{
                          id: j.id,
                          nama: j.nama,
                          deskripsi: j.deskripsi,
                          frekuensi: j.frekuensi,
                          hariJatuhTempo: j.hariJatuhTempo,
                          terbitOtomatis: j.terbitOtomatis,
                          aktif: j.aktif,
                          adaTagihan: j._count.tagihan > 0,
                        }}
                      />
                    </section>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
