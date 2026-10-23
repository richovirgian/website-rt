import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailWarga } from "@/lib/warga";
import { hapusWarga } from "@/lib/cms/aksi-warga";
import { kodeRumah, LABEL_DOMISILI, LABEL_HUBUNGAN, LABEL_HUNIAN, LABEL_JK } from "@/lib/warga-label";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormWarga } from "@/components/cms/form-warga";
import { FormAkunWarga } from "@/components/cms/form-akun-warga";
import { TombolNik } from "@/components/cms/tombol-nik";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { Lencana } from "@/components/cms/lencana";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail warga" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const iso = (d: Date | null) => (d ? formatTanggal(d.toISOString().slice(0, 10)) : "—");

export default async function HalamanDetailWarga({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const s = await wajibIzin("residents.read");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const identitas = punya(s.peran, "residents.read_identity");
  const w = await detailWarga(id, identitas);
  if (!w) notFound();

  const boleh = punya(s.peran, "residents.update");
  const bolehAkun = boleh && punya(s.peran, "users.manage");
  const akhir4 = "nikAkhir4" in w ? (w.nikAkhir4 as string | null) : null;

  const baris: [string, React.ReactNode][] = [
    ["Rumah", (
      <Link key="r" href={`/admin/rumah/${w.keluarga.rumah.id}`} className="font-semibold text-hijau underline-offset-4 hover:underline">
        {kodeRumah(w.keluarga.rumah)} · {LABEL_HUNIAN[w.keluarga.statusHunian]}
      </Link>
    )],
    ["Hubungan", LABEL_HUBUNGAN[w.hubungan]],
    ["Jenis kelamin", w.jenisKelamin ? LABEL_JK[w.jenisKelamin] : "—"],
    ["Tempat, tanggal lahir", [w.tempatLahir, w.tanggalLahir ? iso(w.tanggalLahir) : null].filter(Boolean).join(", ") || "—"],
    ["Nomor HP", w.noHp ?? "—"],
    ["Pekerjaan", w.pekerjaan ?? "—"],
  ];
  if (identitas) baris.splice(1, 0, ["NIK", <TombolNik key="n" wargaId={w.id} akhir4={akhir4} />]);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/warga" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua warga
      </Link>

      <JudulHalaman
        judul={w.namaLengkap}
        keterangan={`${LABEL_HUBUNGAN[w.hubungan]} di rumah ${kodeRumah(w.keluarga.rumah)}`}
        aksi={<Lencana nada={w.statusDomisili === "AKTIF" ? "hijau" : "abu"}>{LABEL_DOMISILI[w.statusDomisili]}</Lencana>}
      />

      <section aria-labelledby="judul-data" className={`${KARTU} mb-8`}>
        <h2 id="judul-data" className="sr-only">Data warga</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {baris.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">{k}</dt>
              <dd className="mt-1 text-hijau-tua">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {boleh && (
        <section aria-labelledby="judul-ubah" className={`${KARTU} mb-8`}>
          <h2 id="judul-ubah" className="mb-5 text-lg font-bold text-hijau">Ubah data</h2>
          <FormWarga
            keluargaId={w.keluargaId}
            kembaliKe="/admin/warga"
            adaNik={Boolean(akhir4)}
            warga={{
              id: w.id,
              namaLengkap: w.namaLengkap,
              jenisKelamin: w.jenisKelamin,
              tempatLahir: w.tempatLahir,
              tanggalLahir: w.tanggalLahir,
              hubungan: w.hubungan,
              statusDomisili: w.statusDomisili,
              noHp: w.noHp,
              pekerjaan: w.pekerjaan,
            }}
          />
        </section>
      )}

      <section aria-labelledby="judul-akun" className={`${KARTU} mb-8`}>
        <h2 id="judul-akun" className="text-lg font-bold text-hijau">Akun login</h2>
        {w.userId ? (
          <p className="mt-2 text-hijau-tua/85">
            Terhubung dengan akun <strong>{w.user?.email}</strong>.
          </p>
        ) : bolehAkun ? (
          <>
            <p className="mb-5 mt-2 text-sm text-muted-fg">
              Warga ini belum punya akun. Buatkan akun supaya bisa masuk ke portal warga.
            </p>
            <FormAkunWarga wargaId={w.id} />
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-fg">Belum punya akun.</p>
        )}
      </section>

      {boleh && !w.userId && (
        <section className="border-t border-line pt-6">
          <p className="mb-3 text-sm text-muted-fg">
            Hapus hanya untuk data yang salah input. Warga yang pindah cukup diubah status domisilinya.
          </p>
          <TombolHapus
            label="Hapus warga"
            judul="Hapus data warga ini?"
            keterangan={`Data ${w.namaLengkap} akan dihapus permanen.`}
            aksi={hapusWarga.bind(null, w.id)}
            kembaliKe={`/admin/rumah/${w.keluarga.rumah.id}`}
          />
        </section>
      )}
    </div>
  );
}
