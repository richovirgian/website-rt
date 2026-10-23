import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, UserRound } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailKegiatan } from "@/lib/komunikasi-kueri";
import { LABEL_JENIS_KEGIATAN, formatWaktu, isoJakarta, jamSaja } from "@/lib/komunikasi-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Lencana } from "@/components/cms/lencana";
import { FormKegiatan, TombolBatalKegiatan, TombolHadir } from "@/components/cms/form-kegiatan";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kegiatan" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanDetailKegiatan({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibMasuk();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const k = await detailKegiatan(id, s.user.id);
  if (!k) notFound();

  const kelola = punya(peranPengguna(s), "events.manage");
  const akanDatang = k.status === "DIJADWALKAN" && k.mulai > new Date();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/kegiatan" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua kegiatan
      </Link>
      <JudulHalaman
        judul={k.judul}
        keterangan={LABEL_JENIS_KEGIATAN[k.jenis]}
        aksi={k.status === "DIBATALKAN" ? <Lencana nada="merah">Dibatalkan</Lencana> : undefined}
      />

      <section aria-labelledby="judul-info" className={`${KARTU} mb-6`}>
        <h2 id="judul-info" className="sr-only">Informasi kegiatan</h2>
        <ul className="flex flex-col gap-3 text-base">
          <li className="flex items-start gap-3"><CalendarDays className="mt-0.5 size-5 shrink-0 text-hijau" aria-hidden="true" /><span>{formatWaktu(k.mulai)}{k.selesai && ` sampai ${jamSaja(k.selesai)}`}</span></li>
          <li className="flex items-start gap-3"><MapPin className="mt-0.5 size-5 shrink-0 text-hijau" aria-hidden="true" /><span>{k.lokasi}</span></li>
          {k.penanggungJawab && <li className="flex items-start gap-3"><UserRound className="mt-0.5 size-5 shrink-0 text-hijau" aria-hidden="true" /><span>Penanggung jawab: {k.penanggungJawab}</span></li>}
        </ul>
        {k.deskripsi && <p className="mt-5 whitespace-pre-line leading-relaxed text-hijau-tua/90">{k.deskripsi}</p>}
        <p className="mt-5 text-sm text-muted-fg">{k._count.peserta} orang konfirmasi ikut.</p>
      </section>

      {akanDatang && (
        <section aria-labelledby="judul-hadir" className={`${KARTU} mb-6`}>
          <h2 id="judul-hadir" className="mb-4 text-lg font-bold text-hijau">Apakah Anda ikut?</h2>
          <TombolHadir id={k.id} hadir={k.peserta[0]?.hadir ?? null} />
        </section>
      )}

      {kelola && (
        <>
          <section aria-labelledby="judul-ubah" className={`${KARTU} mb-6`}>
            <h2 id="judul-ubah" className="mb-5 text-lg font-bold text-hijau">Ubah kegiatan</h2>
            <FormKegiatan
              kegiatan={{
                id: k.id,
                judul: k.judul,
                deskripsi: k.deskripsi,
                jenis: k.jenis,
                tanggal: isoJakarta(k.mulai),
                jamMulai: jamSaja(k.mulai),
                jamSelesai: k.selesai ? jamSaja(k.selesai) : null,
                lokasi: k.lokasi,
                penanggungJawab: k.penanggungJawab,
              }}
            />
          </section>
          {k.status === "DIJADWALKAN" && <TombolBatalKegiatan id={k.id} />}
        </>
      )}
    </div>
  );
}
