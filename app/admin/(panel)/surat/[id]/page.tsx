import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailSurat } from "@/lib/komunikasi-kueri";
import { kodeRumah } from "@/lib/warga-label";
import { LABEL_STATUS_SURAT, NADA_SURAT, formatWaktu } from "@/lib/komunikasi-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarLampiran } from "@/components/cms/lampiran";
import { Lencana } from "@/components/cms/lencana";
import { AksiPutusanSurat, FormKirimUlangSurat, TombolBatalSurat } from "@/components/cms/form-surat";
import { KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail surat" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanDetailSurat({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibMasuk();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const x = await detailSurat(id);
  if (!x) notFound();

  const peran = peranPengguna(s);
  const admin = punya(peran, "letters.read");
  const pemilik = x.pemohonUserId === s.user.id;
  // Yang bukan Admin dan bukan pemohonnya dialihkan, tanpa membocorkan bahwa pengajuan itu ada.
  if (!admin && !pemilik) redirect("/admin");

  const rumah = kodeRumah(x.pemohon.keluarga.rumah);
  const aktif = x.status === "DIAJUKAN" || x.status === "REVISI";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/surat" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {admin ? "Pengajuan surat" : "Surat saya"}
      </Link>
      <JudulHalaman judul={x.jenisSurat.nama} keterangan={`Diajukan ${formatWaktu(x.dibuatPada)}`} aksi={<Lencana nada={NADA_SURAT[x.status]}>{LABEL_STATUS_SURAT[x.status]}</Lencana>} />

      <section aria-labelledby="judul-data" className={`${KARTU} mb-6`}>
        <h2 id="judul-data" className="sr-only">Data pengajuan</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Pemohon</dt><dd className="mt-1">{x.pemohon.namaLengkap} · rumah {rumah}</dd></div>
          {x.nomor && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Nomor surat</dt><dd className="mt-1 font-mono font-semibold">{x.nomor}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Keperluan</dt><dd className="mt-1 whitespace-pre-line">{x.keperluan}</dd></div>
          {x.diputuskanOleh && x.diputuskanPada && (
            <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Diputuskan</dt><dd className="mt-1">{x.diputuskanOleh}, {formatWaktu(x.diputuskanPada)}</dd></div>
          )}
        </dl>
        {x.alasan && (
          <p role="note" className="mt-5 rounded-lg border border-amber-700/30 bg-jingga/10 p-3 text-sm text-hijau-tua">
            <strong>Catatan pengurus:</strong> {x.alasan}
          </p>
        )}
        <DaftarLampiran berkas={x.lampiran} judul="Dokumen pendukung" />
      </section>

      {x.status === "DISETUJUI" && (
        <div className="mb-6">
          <Link href={`/admin/surat/${x.id}/cetak`} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
            <Printer className="size-4" aria-hidden="true" />
            Buka surat untuk dicetak
          </Link>
        </div>
      )}

      {admin && x.status === "DIAJUKAN" && (
        <section aria-labelledby="judul-putusan" className={KARTU}>
          <h2 id="judul-putusan" className="mb-4 text-lg font-bold text-hijau">Keputusan</h2>
          <AksiPutusanSurat id={x.id} ringkas={`${x.jenisSurat.nama} untuk ${x.pemohon.namaLengkap}.`} />
        </section>
      )}

      {pemilik && x.status === "REVISI" && (
        <section aria-labelledby="judul-revisi" className={`${KARTU} mb-6`}>
          <h2 id="judul-revisi" className="mb-4 text-lg font-bold text-hijau">Perbaiki dan kirim ulang</h2>
          <FormKirimUlangSurat id={x.id} keperluan={x.keperluan} />
        </section>
      )}

      {pemilik && aktif && (
        <section className="mt-6 border-t border-line pt-5">
          <TombolBatalSurat id={x.id} />
        </section>
      )}
    </div>
  );
}
