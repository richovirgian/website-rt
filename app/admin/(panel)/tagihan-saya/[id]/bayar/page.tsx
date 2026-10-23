import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { tagihanUntukBayar } from "@/lib/pembayaran-kueri";
import { pengaturanRt } from "@/lib/pengaturan";
import { kodeRumah } from "@/lib/warga-label";
import { formatRupiah, isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormBayarTransfer } from "@/components/cms/form-bayar-transfer";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Bayar tagihan" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Halaman bayar. Tagihan dicari dari ID akun: tagihan rumah lain dijawab 404. */
export default async function HalamanBayar({ params }: { params: Promise<{ id: string }> }) {
  const s = await wajibIzin("payments.create.own");
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const t = await tagihanUntukBayar(s.user.id, id);
  if (!t) notFound();
  if (t.status !== "UNPAID") redirect("/admin/tagihan-saya");

  const menunggu = t.pembayaran[0]?.status === "PENDING";
  const rt = await pengaturanRt();
  const rekening =
    rt.nomorRekening && rt.namaBank
      ? { bank: rt.namaBank, nomor: rt.nomorRekening, atasNama: rt.atasNamaRekening || rt.namaRt }
      : null;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/tagihan-saya" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Tagihan saya
      </Link>
      <JudulHalaman judul="Bayar tagihan" keterangan={`${t.judul} · rumah ${kodeRumah(t.rumah)} · jatuh tempo ${formatTanggal(isoDari(t.jatuhTempo))}`} />

      {menunggu ? (
        <div className={KARTU}>
          <h2 className="text-lg font-bold text-hijau">Menunggu verifikasi</h2>
          <p className="mt-2 leading-relaxed text-hijau-tua/85">
            Bukti transfer Anda sudah terkirim dan sedang diperiksa bendahara. Anda tidak perlu mengirim ulang.
            Status akan berubah di halaman Tagihan saya.
          </p>
        </div>
      ) : (
        <div className={KARTU}>
          {t.pembayaran[0]?.status === "REJECTED" && (
            <p role="alert" className="mb-5 rounded-lg border border-red-700/30 bg-red-50 p-3 text-sm text-red-800">
              Pengiriman sebelumnya ditolak{t.pembayaran[0].alasanTolak ? `: ${t.pembayaran[0].alasanTolak}` : "."} Silakan kirim ulang bukti yang benar.
            </p>
          )}
          <FormBayarTransfer tagihanId={t.id} nominal={formatRupiah(t.nominal)} rekening={rekening} />
        </div>
      )}
    </div>
  );
}
