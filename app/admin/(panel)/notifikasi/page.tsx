import type { Metadata } from "next";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarNotifikasi, jumlahNotifikasiBelumDibaca, PER_HALAMAN_KOM } from "@/lib/komunikasi-kueri";
import { statusKanal } from "@/lib/notifikasi";
import { nomorHalaman } from "@/lib/warga";
import { formatWaktu } from "@/lib/komunikasi-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Paginasi } from "@/components/cms/paginasi";
import { ItemNotifikasi, TombolTandaiSemua } from "@/components/cms/item-notifikasi";
import { Lencana } from "@/components/cms/lencana";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifikasi" };

export default async function HalamanNotifikasi({ searchParams }: { searchParams: Promise<{ halaman?: string }> }) {
  const s = await wajibMasuk();
  const nomor = nomorHalaman((await searchParams).halaman);
  const [{ baris, total }, belum] = await Promise.all([daftarNotifikasi(s.user.id, nomor), jumlahNotifikasiBelumDibaca(s.user.id)]);
  const lihatKanal = punya(peranPengguna(s), "settings.manage");

  return (
    <div className="max-w-2xl">
      <JudulHalaman judul="Notifikasi" keterangan={belum > 0 ? `${belum} belum dibaca.` : "Semua sudah dibaca."} aksi={belum > 0 && <TombolTandaiSemua />} />

      {baris.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada notifikasi.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {baris.map((n) => (
            <li key={n.id}>
              <ItemNotifikasi id={n.id} judul={n.judul} isi={n.isi} waktu={formatWaktu(n.dibuatPada)} dibaca={!!n.dibacaPada} />
            </li>
          ))}
        </ul>
      )}
      <Paginasi jalur="/admin/notifikasi" halaman={nomor} total={total} perHalaman={PER_HALAMAN_KOM} />

      {lihatKanal && (
        <section aria-labelledby="judul-kanal" className={`${KARTU} mt-10`}>
          <h2 id="judul-kanal" className="text-lg font-bold text-hijau">Kanal notifikasi</h2>
          <p className="mt-1 text-sm text-muted-fg">
            Saat ini notifikasi hanya dikirim di dalam aplikasi. Email dan WhatsApp belum dibangun, jadi tidak ada notifikasi yang ditandai terkirim lewat kanal itu.
          </p>
          <ul className="mt-4 divide-y divide-line text-sm">
            {statusKanal().map((k) => (
              <li key={k.nama} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="font-medium text-hijau-tua">{k.nama}</span>
                <Lencana nada={k.status === "Aktif" ? "hijau" : "abu"}>{k.status}</Lencana>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
