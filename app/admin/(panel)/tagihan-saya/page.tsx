import type { Metadata } from "next";
import Link from "next/link";
import { wajibIzin } from "@/lib/cms/sesi";
import { tagihanRumahSaya } from "@/lib/iuran-kueri";
import { kodeRumah } from "@/lib/warga-label";
import { LABEL_STATUS } from "@/lib/iuran-label";
import { NADA_STATUS, statusTampil } from "@/lib/tagihan-tampil";
import { formatRupiah, hariIni, isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tagihan saya" };

/** Tagihan rumah milik akun yang masuk. Datanya dari ID sesi, bukan dari URL. */
export default async function HalamanTagihanSaya() {
  const s = await wajibIzin("bills.read.own");
  const data = await tagihanRumahSaya(s.user.id);
  const hari = hariIni();

  if (!data) {
    return (
      <div className="max-w-2xl">
        <JudulHalaman judul="Tagihan saya" />
        <div className={KARTU}>
          <p className="leading-relaxed text-hijau-tua/85">
            Akun Anda belum dihubungkan ke data rumah tangga yang masih tinggal. Hubungi pengurus RT.
          </p>
        </div>
      </div>
    );
  }

  const belum = data.tagihan.filter((t) => t.status === "UNPAID");
  const total = belum.reduce((n, t) => n + t.nominal.toNumber(), 0);

  return (
    <div className="max-w-3xl">
      <JudulHalaman judul="Tagihan saya" keterangan={`Tagihan iuran rumah ${kodeRumah(data.rumah)}.`} />

      <section aria-label="Ringkasan" className={`${KARTU} mb-6`}>
        <p className="text-sm text-muted-fg">Belum dibayar</p>
        <p className="mt-1 text-3xl font-bold text-hijau">{formatRupiah(total)}</p>
        <p className="mt-1 text-sm text-muted-fg">{belum.length} tagihan</p>
        {belum.length > 0 && (
          <p className="mt-4 rounded-lg bg-krem-2 p-3 text-sm leading-relaxed text-hijau-tua/85">
            Bayar lewat transfer dan kirim bukti dari halaman ini, atau serahkan tunai kepada bendahara. Tagihan lunas setelah bendahara memverifikasi.
          </p>
        )}
      </section>

      {data.tagihan.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada tagihan untuk rumah Anda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data.tagihan.map((t) => {
            const st = statusTampil(t.status, t.jatuhTempo, hari);
            const bayar = t.pembayaran[0];
            const menunggu = bayar?.status === "PENDING";
            const ditolak = bayar?.status === "REJECTED";
            return (
              <li key={t.id} className={`${KARTU} flex flex-col gap-3`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-hijau">{t.judul}</p>
                    <p className="mt-0.5 text-sm text-muted-fg">Jatuh tempo {formatTanggal(isoDari(t.jatuhTempo))}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-bold text-hijau-tua">{formatRupiah(t.nominal)}</p>
                    {menunggu ? <Lencana nada="jingga">Menunggu verifikasi</Lencana> : <Lencana nada={NADA_STATUS[st]}>{LABEL_STATUS[st]}</Lencana>}
                  </div>
                </div>
                {ditolak && (
                  <p role="alert" className="rounded-lg border border-red-700/30 bg-red-50 p-3 text-sm text-red-800">
                    Pembayaran ditolak{bayar.alasanTolak ? `: ${bayar.alasanTolak}` : "."}
                  </p>
                )}
                {t.status === "UNPAID" && !menunggu && (
                  <Link href={`/admin/tagihan-saya/${t.id}/bayar`} className={`${TOMBOL_UTAMA} w-full sm:w-auto sm:self-start`}>
                    {ditolak ? "Kirim ulang bukti" : "Bayar"}
                  </Link>
                )}
                {t.status === "PAID" && bayar?.kuitansi && (
                  <Link href={`/admin/kuitansi/${bayar.kuitansi.id}`} className={`${TOMBOL_SEKUNDER} w-full sm:w-auto sm:self-start`}>
                    Lihat kuitansi
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
