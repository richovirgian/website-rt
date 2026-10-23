import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { dataCetakSurat } from "@/lib/komunikasi-kueri";
import { pengaturanRt } from "@/lib/pengaturan";
import { dekripsi } from "@/lib/enkripsi";
import { catatAudit } from "@/lib/audit";
import { pakaiNik, renderSurat } from "@/lib/surat";
import { kodeRumah } from "@/lib/warga-label";
import { isoJakarta } from "@/lib/komunikasi-label";
import { formatTanggal } from "@/lib/profil";
import { TombolCetak } from "@/components/cms/tombol-cetak";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cetak surat" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Surat siap cetak. Hanya untuk pengajuan yang DISETUJUI. Admin atau pemohon
 * saja. NIK didekripsi di sini, hanya bila templat memakainya, dan
 * pembukaannya oleh Admin dicatat di audit log. Isi memakai salinan templat
 * saat disetujui, jadi perubahan templat tidak mengubah surat yang sudah terbit.
 */
export default async function HalamanCetakSurat({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibMasuk();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const x = await dataCetakSurat(id);
  if (!x) notFound();

  const peran = peranPengguna(s);
  const admin = punya(peran, "letters.read");
  if (!admin && x.pemohonUserId !== s.user.id) redirect("/admin");
  if (x.status !== "DISETUJUI" || !x.templatSnapshot || !x.nomor) redirect(`/admin/surat/${id}`);

  const rt = await pengaturanRt();
  const rumah = x.pemohon.keluarga.rumah;

  let nik = "—";
  if (pakaiNik(x.templatSnapshot) && x.pemohon.nikEnkripsi) {
    try {
      nik = dekripsi(x.pemohon.nikEnkripsi);
      if (admin && x.pemohonUserId !== s.user.id) {
        await catatAudit({ aktorId: s.user.id, aktorNama: s.user.name, aksi: "surat.cetak_nik", entitas: "pengajuan_surat", entitasId: id });
      }
    } catch (e) {
      console.error("[surat] gagal membuka NIK untuk cetak:", e);
    }
  }

  const isi = renderSurat(x.templatSnapshot, {
    nama: x.pemohon.namaLengkap,
    nik,
    rumah: kodeRumah(rumah),
    alamat: rumah.alamat ? `${rumah.alamat} (${kodeRumah(rumah)})` : `Rumah ${kodeRumah(rumah)}`,
    keperluan: x.keperluan,
    tanggal: formatTanggal(isoJakarta(x.diputuskanPada ?? new Date())),
    nomor: x.nomor,
    rt: rt.namaRt,
    wilayah: rt.alamat || "-",
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/surat/${id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali
        </Link>
        <TombolCetak />
      </div>

      <article aria-label={`Surat ${x.nomor}`} className="rounded-2xl border border-line bg-white p-7 text-hijau-tua sm:p-12 print:rounded-none print:border-0 print:p-0">
        <header className="border-b-2 border-hijau-tua pb-4 text-center">
          <p className="text-lg font-bold uppercase tracking-wide">{rt.namaRt}</p>
          <p className="text-sm">{rt.alamat}</p>
        </header>
        <div className="mt-6 text-center">
          <h1 className="text-xl font-bold uppercase underline underline-offset-4">{x.jenisSurat.nama}</h1>
          <p className="mt-1 text-sm">Nomor: {x.nomor}</p>
        </div>
        <div className="mt-8 whitespace-pre-wrap font-serif text-base leading-relaxed">{isi}</div>
        <footer className="mt-12 flex justify-end">
          <div className="w-64 text-center text-sm">
            <p>{formatTanggal(isoJakarta(x.diputuskanPada ?? new Date()))}</p>
            <p>Ketua {rt.namaRt}</p>
            <p className="mt-16 font-semibold underline">{x.diputuskanOleh ?? "Ketua RT"}</p>
          </div>
        </footer>
        <p className="mt-10 border-t border-line pt-3 text-center text-xs text-muted-fg print:text-black">
          Surat ini diterbitkan oleh pengurus RT dan berlaku sebagai surat pengantar tingkat RT, bukan dokumen resmi instansi pemerintah.
        </p>
      </article>
    </div>
  );
}
