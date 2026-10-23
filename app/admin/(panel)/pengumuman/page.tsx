import type { Metadata } from "next";
import Link from "next/link";
import { Paperclip, Pin, Plus } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarPengumuman, PER_HALAMAN_KOM } from "@/lib/komunikasi-kueri";
import { nomorHalaman } from "@/lib/warga";
import { LABEL_KATEGORI_PENGUMUMAN, formatWaktu } from "@/lib/komunikasi-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengumuman" };

export default async function HalamanPengumuman({ searchParams }: { searchParams: Promise<{ halaman?: string }> }) {
  const s = await wajibMasuk();
  const kelola = punya(peranPengguna(s), "announcements.manage");
  const nomor = nomorHalaman((await searchParams).halaman);
  const { baris, total } = await daftarPengumuman({ userId: s.user.id, semua: kelola, halaman: nomor });
  const sekarang = new Date();

  return (
    <div className="max-w-3xl">
      <JudulHalaman
        judul="Pengumuman"
        keterangan="Kabar resmi dari pengurus RT."
        aksi={
          kelola && (
            <Link href="/admin/pengumuman/baru" className={TOMBOL_UTAMA}>
              <Plus className="size-4" aria-hidden="true" />
              Buat pengumuman
            </Link>
          )
        }
      />
      {baris.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada pengumuman.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {baris.map((p) => {
            const belumDibaca = p.dibaca.length === 0 && p.status === "TERBIT";
            const terjadwal = p.status === "TERBIT" && p.terbitPada && p.terbitPada > sekarang;
            return (
              <li key={p.id}>
                <Link href={`/admin/pengumuman/${p.id}`} className={`${KARTU} block transition-colors hover:border-jingga/60 ${p.disematkan ? "border-jingga/50 bg-jingga/5" : ""}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.disematkan && <Pin className="size-4 text-amber-800" aria-label="Disematkan" />}
                    <Lencana nada={p.kategori === "PENTING" ? "merah" : "abu"}>{LABEL_KATEGORI_PENGUMUMAN[p.kategori]}</Lencana>
                    {kelola && p.status === "DRAFT" && <Lencana nada="jingga">Draf</Lencana>}
                    {kelola && terjadwal && <Lencana nada="jingga">Terjadwal</Lencana>}
                    {belumDibaca && !kelola && <Lencana nada="hijau">Baru</Lencana>}
                    {p._count.lampiran > 0 && <Paperclip className="size-4 text-muted-fg" aria-label={`${p._count.lampiran} lampiran`} />}
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-hijau">{p.judul}</h2>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-hijau-tua/80">{p.isi}</p>
                  <p className="mt-3 text-xs text-muted-fg">
                    {p.penulis}
                    {p.terbitPada && ` · ${formatWaktu(p.terbitPada)}`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Paginasi jalur="/admin/pengumuman" halaman={nomor} total={total} perHalaman={PER_HALAMAN_KOM} />
    </div>
  );
}
