import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailPengumuman } from "@/lib/komunikasi-kueri";
import { hapusPengumuman } from "@/lib/cms/aksi-pengumuman";
import { LABEL_KATEGORI_PENGUMUMAN, formatWaktu, isoJakarta, jamSaja } from "@/lib/komunikasi-label";
import { DaftarLampiran } from "@/components/cms/lampiran";
import { FormPengumuman, TandaiDibaca } from "@/components/cms/form-pengumuman";
import { Lencana } from "@/components/cms/lencana";
import { TombolHapus } from "@/components/cms/tombol-konfirmasi";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengumuman" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function HalamanDetailPengumuman({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibMasuk();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const kelola = punya(peranPengguna(s), "announcements.manage");
  // Warga hanya menemukan pengumuman yang sudah terlihat; draf dan terjadwal dijawab 404.
  const p = await detailPengumuman(id, kelola);
  if (!p) notFound();

  const sekarang = new Date();
  const terlihat = p.status === "TERBIT" && !!p.terbitPada && p.terbitPada <= sekarang;
  const terjadwal = p.status === "TERBIT" && !!p.terbitPada && p.terbitPada > sekarang;

  return (
    <div className="max-w-3xl">
      {terlihat && <TandaiDibaca id={p.id} />}
      <Link href="/admin/pengumuman" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua pengumuman
      </Link>

      <article className={`${KARTU} mb-8`}>
        <div className="flex flex-wrap items-center gap-2">
          <Lencana nada={p.kategori === "PENTING" ? "merah" : "abu"}>{LABEL_KATEGORI_PENGUMUMAN[p.kategori]}</Lencana>
          {p.status === "DRAFT" && <Lencana nada="jingga">Draf</Lencana>}
          {terjadwal && <Lencana nada="jingga">Terjadwal</Lencana>}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-hijau sm:text-3xl">{p.judul}</h1>
        <p className="mt-1 text-sm text-muted-fg">{p.penulis}{p.terbitPada && ` · ${formatWaktu(p.terbitPada)}`}</p>
        <div className="mt-5 whitespace-pre-line text-base leading-relaxed text-hijau-tua">{p.isi}</div>
        <DaftarLampiran berkas={p.lampiran} />
      </article>

      {kelola && (
        <>
          <section aria-labelledby="judul-ubah" className={`${KARTU} mb-8`}>
            <h2 id="judul-ubah" className="mb-5 text-lg font-bold text-hijau">Ubah pengumuman</h2>
            <FormPengumuman
              pengumuman={{
                id: p.id,
                judul: p.judul,
                isi: p.isi,
                kategori: p.kategori,
                disematkan: p.disematkan,
                mode: p.status === "DRAFT" ? "DRAFT" : terjadwal ? "JADWAL" : "TETAP",
                tanggalTerbit: p.terbitPada ? isoJakarta(p.terbitPada) : "",
                jamTerbit: p.terbitPada ? jamSaja(p.terbitPada) : "07:00",
                lampiran: p.lampiran,
              }}
            />
          </section>
          <TombolHapus
            label="Hapus pengumuman"
            judul="Hapus pengumuman ini?"
            keterangan="Pengumuman dan lampirannya dihapus permanen."
            aksi={hapusPengumuman.bind(null, p.id)}
            kembaliKe="/admin/pengumuman"
          />
        </>
      )}
    </div>
  );
}
