import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { detailKuitansi, rumahIdMilik } from "@/lib/pembayaran-kueri";
import { pengaturanRt } from "@/lib/pengaturan";
import { kodeRumah } from "@/lib/warga-label";
import { formatRupiah, isoDari } from "@/lib/uang";
import { terbilangRupiah } from "@/lib/terbilang";
import { formatTanggal } from "@/lib/profil";
import { TombolCetak } from "@/components/cms/tombol-cetak";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kuitansi" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Kuitansi. Pengurus (`receipts.read`) boleh membuka semuanya; warga hanya
 * kuitansi untuk tagihan rumahnya sendiri. Yang tidak berhak dialihkan, tanpa
 * membocorkan bahwa kuitansi itu ada.
 */
export default async function HalamanKuitansi({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibMasuk();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const k = await detailKuitansi(id);
  if (!k) notFound();

  const peran = peranPengguna(s);
  let boleh = punya(peran, "receipts.read");
  if (!boleh && punya(peran, "receipts.read.own")) {
    boleh = (await rumahIdMilik(s.user.id)) === k.pembayaran.tagihan.rumahId;
  }
  if (!boleh) redirect("/admin");

  const rt = await pengaturanRt();
  const p = k.pembayaran;
  const batal = p.status === "VOIDED";
  const nominal = p.nominal.toNumber();
  const baris: [string, string][] = [
    ["Telah diterima dari", p.dibayarOleh ?? `Warga rumah ${kodeRumah(p.tagihan.rumah)}`],
    ["Untuk pembayaran", p.tagihan.judul],
    ["Rumah", kodeRumah(p.tagihan.rumah)],
    ["Metode", p.metode === "TUNAI" ? "Tunai" : "Transfer bank"],
    ["Tanggal bayar", formatTanggal(isoDari(p.tanggalBayar))],
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={punya(peran, "receipts.read") ? "/admin/pembayaran?tampil=riwayat" : "/admin/tagihan-saya"} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Kembali
        </Link>
        <TombolCetak />
      </div>

      <article aria-labelledby="judul-kuitansi" className="relative overflow-hidden rounded-2xl border-2 border-hijau bg-white p-6 text-hijau-tua sm:p-9 print:rounded-none print:border-black print:p-6">
        {batal && (
          <p aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center text-6xl font-black uppercase tracking-widest text-red-700/15 sm:text-8xl">
            Dibatalkan
          </p>
        )}
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-fg">{rt.namaRt}</p>
            <h1 id="judul-kuitansi" className="mt-1 text-3xl font-bold tracking-tight text-hijau">KUITANSI</h1>
          </div>
          <div className="text-right text-sm">
            <p className="font-mono font-bold text-hijau-tua">{k.nomor}</p>
            <p className="text-muted-fg">Terbit {formatTanggal(isoDari(k.diterbitkanPada))}</p>
          </div>
        </header>

        {batal && (
          <p role="alert" className="mt-5 rounded-lg border border-red-700/30 bg-red-50 p-3 text-sm font-semibold text-red-800">
            Kuitansi ini sudah dibatalkan{p.dibatalkanAlasan ? `: ${p.dibatalkanAlasan}` : "."} Tidak berlaku sebagai bukti pembayaran.
          </p>
        )}

        <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-[11rem_1fr]">
          {baris.map(([a, b]) => (
            <div key={a} className="contents">
              <dt className="text-sm font-semibold text-muted-fg">{a}</dt>
              <dd className="text-base">{b}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 rounded-xl bg-krem-2 p-5 print:border print:border-black print:bg-white">
          <p className="text-sm font-semibold text-muted-fg">Jumlah</p>
          <p className="mt-1 text-3xl font-bold text-hijau">{formatRupiah(nominal)}</p>
          <p className="mt-2 text-sm italic">Terbilang: {terbilangRupiah(nominal)}</p>
        </div>

        <footer className="mt-8 flex flex-wrap items-end justify-between gap-6 text-sm">
          <p className="max-w-xs text-muted-fg">Kuitansi ini diterbitkan sistem setelah pembayaran dinyatakan sah oleh bendahara.</p>
          <div className="text-center">
            <p className="text-muted-fg">Diverifikasi oleh</p>
            <p className="mt-8 border-t border-hijau-tua/40 px-6 pt-1 font-semibold">{p.diverifikasiOleh ?? "Bendahara"}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
