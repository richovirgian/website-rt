import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailPengaduan } from "@/lib/komunikasi-kueri";
import { kodeRumah } from "@/lib/warga-label";
import { LABEL_KATEGORI_PENGADUAN, LABEL_STATUS_PENGADUAN, NADA_PENGADUAN, formatWaktu } from "@/lib/komunikasi-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarLampiran } from "@/components/cms/lampiran";
import { Lencana } from "@/components/cms/lencana";
import { FormStatusPengaduan, FormTanggapan } from "@/components/cms/form-pengaduan";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail pengaduan" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function lamaSelesai(dari: Date, sampai: Date): string {
  const menit = Math.max(0, Math.round((sampai.getTime() - dari.getTime()) / 60000));
  const hari = Math.floor(menit / 1440);
  const jam = Math.floor((menit % 1440) / 60);
  if (hari > 0) return `${hari} hari ${jam} jam`;
  if (jam > 0) return `${jam} jam ${menit % 60} menit`;
  return `${menit} menit`;
}

export default async function HalamanDetailPengaduan({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibMasuk();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const x = await detailPengaduan(id);
  if (!x) notFound();

  const peran = peranPengguna(s);
  const admin = punya(peran, "complaints.read");
  const pelapor = x.pelaporUserId === s.user.id;
  // Pengaduan bersifat privat: selain Admin dan pelapornya, dialihkan tanpa membocorkan keberadaannya.
  if (!admin && !pelapor) redirect("/admin");

  return (
    <div className="max-w-3xl">
      <Link href="/admin/pengaduan" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {admin ? "Semua pengaduan" : "Pengaduan saya"}
      </Link>
      <JudulHalaman judul={x.judul} keterangan={`${x.nomor} · ${LABEL_KATEGORI_PENGADUAN[x.kategori]}`} aksi={<Lencana nada={NADA_PENGADUAN[x.status]}>{LABEL_STATUS_PENGADUAN[x.status]}</Lencana>} />

      <section aria-labelledby="judul-isi" className={`${KARTU} mb-6`}>
        <h2 id="judul-isi" className="sr-only">Isi pengaduan</h2>
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Pelapor</dt><dd className="mt-1">{x.pelaporNama}{x.rumah && ` · rumah ${kodeRumah(x.rumah)}`}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Dilaporkan</dt><dd className="mt-1">{formatWaktu(x.dibuatPada)}</dd></div>
          {x.lokasi && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Lokasi</dt><dd className="mt-1">{x.lokasi}</dd></div>}
          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Penanggung jawab</dt><dd className="mt-1">{x.penanggungJawab ?? "Belum ditentukan"}</dd></div>
          {x.selesaiPada && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Waktu penyelesaian</dt><dd className="mt-1">{lamaSelesai(x.dibuatPada, x.selesaiPada)}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Keterangan</dt><dd className="mt-1 whitespace-pre-line">{x.deskripsi}</dd></div>
        </dl>
        <DaftarLampiran berkas={x.lampiran} judul="Foto pendukung" />
      </section>

      <section aria-labelledby="judul-riwayat" className={`${KARTU} mb-6`}>
        <h2 id="judul-riwayat" className="mb-4 text-lg font-bold text-hijau">Riwayat tindak lanjut</h2>
        <ol className="relative border-l-2 border-hijau/20 pl-6">
          {x.pembaruan.map((u) => (
            <li key={u.id} className="relative pb-6 last:pb-0">
              <span aria-hidden="true" className={`absolute -left-[1.95rem] top-1 size-4 rounded-full border-4 border-surface ${u.dariPelapor ? "bg-hijau" : "bg-jingga"}`} />
              <p className="text-sm text-muted-fg">
                {formatWaktu(u.dibuatPada)} · {u.oleh}{u.dariPelapor ? " (pelapor)" : ""}
                {u.status && <span className="ml-2"><Lencana nada={NADA_PENGADUAN[u.status]}>{LABEL_STATUS_PENGADUAN[u.status]}</Lencana></span>}
              </p>
              <p className="mt-1 whitespace-pre-line">{u.catatan}</p>
            </li>
          ))}
        </ol>
      </section>

      {admin && (
        <section aria-labelledby="judul-tindak" className={`${KARTU} mb-6`}>
          <h2 id="judul-tindak" className="mb-4 text-lg font-bold text-hijau">Tindak lanjut</h2>
          <FormStatusPengaduan id={x.id} status={x.status} penanggungJawab={x.penanggungJawab} />
        </section>
      )}
      {pelapor && x.status !== "DITUTUP" && (
        <section aria-labelledby="judul-tanggapan" className={KARTU}>
          <h2 id="judul-tanggapan" className="mb-4 text-lg font-bold text-hijau">Tambah keterangan</h2>
          <FormTanggapan id={x.id} />
        </section>
      )}
    </div>
  );
}
