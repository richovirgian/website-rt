import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarKegiatan } from "@/lib/komunikasi-kueri";
import { LABEL_JENIS_KEGIATAN, formatWaktu } from "@/lib/komunikasi-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kegiatan" };

export default async function HalamanKegiatan() {
  const s = await wajibMasuk();
  const kelola = punya(peranPengguna(s), "events.manage");
  const { mendatang, lalu } = await daftarKegiatan(s.user.id);

  const kartu = (k: (typeof mendatang)[number]) => (
    <li key={k.id}>
      <Link href={`/admin/kegiatan/${k.id}`} className={`${KARTU} block transition-colors hover:border-jingga/60`}>
        <div className="flex flex-wrap items-center gap-2">
          <Lencana nada="abu">{LABEL_JENIS_KEGIATAN[k.jenis]}</Lencana>
          {k.status === "DIBATALKAN" && <Lencana nada="merah">Dibatalkan</Lencana>}
          {k.peserta[0]?.hadir === true && <Lencana nada="hijau">Anda ikut</Lencana>}
          {k.peserta[0]?.hadir === false && <Lencana nada="abu">Anda tidak ikut</Lencana>}
        </div>
        <h3 className="mt-2 text-lg font-semibold text-hijau">{k.judul}</h3>
        <p className="mt-1 text-sm text-hijau-tua/80">{formatWaktu(k.mulai)} · {k.lokasi}</p>
        <p className="mt-1 text-xs text-muted-fg">{k._count.peserta} orang konfirmasi ikut</p>
      </Link>
    </li>
  );

  return (
    <div className="max-w-3xl">
      <JudulHalaman
        judul="Kegiatan"
        keterangan="Kalender kegiatan warga. Konfirmasi ikut atau tidak supaya pengurus bisa menyiapkan."
        aksi={kelola && <Link href="/admin/kegiatan/baru" className={TOMBOL_UTAMA}><Plus className="size-4" aria-hidden="true" />Tambah kegiatan</Link>}
      />
      <section aria-labelledby="judul-mendatang" className="mb-10">
        <h2 id="judul-mendatang" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">Akan datang</h2>
        {mendatang.length === 0 ? <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada kegiatan terjadwal.</p> : <ul className="flex flex-col gap-3">{mendatang.map(kartu)}</ul>}
      </section>
      {lalu.length > 0 && (
        <section aria-labelledby="judul-lalu">
          <h2 id="judul-lalu" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">Sudah lewat atau dibatalkan</h2>
          <ul className="flex flex-col gap-3 opacity-80">{lalu.map(kartu)}</ul>
        </section>
      )}
    </div>
  );
}
