import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { antreanPembayaran, PER_HALAMAN_PEMBAYARAN, riwayatPembayaran } from "@/lib/pembayaran-kueri";
import { nomorHalaman } from "@/lib/warga";
import { kodeRumah } from "@/lib/warga-label";
import { formatRupiah, isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { cn } from "@/lib/utils";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { AksiBatalkanPembayaran, AksiVerifikasi } from "@/components/cms/aksi-pembayaran";
import { KARTU, KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pembayaran" };

const LABEL = { PENDING: "Menunggu verifikasi", VERIFIED: "Terverifikasi", REJECTED: "Ditolak", VOIDED: "Dibatalkan" } as const;
const NADA = { PENDING: "jingga", VERIFIED: "hijau", REJECTED: "merah", VOIDED: "abu" } as const;

export default async function HalamanPembayaran({
  searchParams,
}: {
  searchParams: Promise<{ tampil?: string; status?: string; halaman?: string }>;
}) {
  const s = await wajibIzin("payments.read");
  const p = await searchParams;
  const riwayat = p.tampil === "riwayat";
  const bolehVerifikasi = punya(s.peran, "payments.verify");
  const nomor = nomorHalaman(p.halaman);

  const antre = riwayat ? [] : await antreanPembayaran();
  const data = riwayat ? await riwayatPembayaran({ status: p.status, halaman: nomor }) : null;

  const tab = (label: string, aktif: boolean, href: string) => (
    <Link
      href={href}
      aria-current={aktif ? "page" : undefined}
      className={cn("rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors", aktif ? "bg-hijau text-krem" : "text-hijau hover:bg-krem-2")}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-5xl">
      <JudulHalaman
        judul="Pembayaran"
        keterangan="Transfer warga menunggu diperiksa bendahara. Tagihan baru lunas setelah disetujui."
      />

      <nav aria-label="Tampilan" className="mb-5 flex flex-wrap gap-2">
        {tab(`Menunggu verifikasi${!riwayat && antre.length ? ` (${antre.length})` : ""}`, !riwayat, "/admin/pembayaran")}
        {tab("Riwayat", riwayat, "/admin/pembayaran?tampil=riwayat")}
      </nav>

      {!riwayat ? (
        antre.length === 0 ? (
          <p className={`${KARTU} text-sm text-muted-fg`}>Tidak ada pembayaran yang menunggu verifikasi.</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {antre.map((b) => (
              <li key={b.id} className={KARTU}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-fg">Rumah {kodeRumah(b.tagihan.rumah)}</p>
                    <h2 className="text-lg font-semibold text-hijau">{b.tagihan.judul}</h2>
                  </div>
                  <p className="text-2xl font-bold text-hijau">{formatRupiah(b.nominal)}</p>
                </div>
                <dl className="mt-3 grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-3 sm:block"><dt className="text-muted-fg">Pengirim</dt><dd className="text-hijau-tua">{b.dibayarOleh ?? "—"}</dd></div>
                  <div className="flex justify-between gap-3 sm:block"><dt className="text-muted-fg">Tanggal transfer</dt><dd className="text-hijau-tua">{formatTanggal(isoDari(b.tanggalBayar))}</dd></div>
                  {b.catatan && <div className="sm:col-span-2"><dt className="text-muted-fg">Catatan</dt><dd className="text-hijau-tua">{b.catatan}</dd></div>}
                </dl>

                {b.bukti && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-fg">Bukti transfer</p>
                    {b.bukti.tipe.startsWith("image/") ? (
                      <a href={`/api/bukti/${b.bukti.id}`} target="_blank" rel="noopener noreferrer" className="inline-block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`/api/bukti/${b.bukti.id}`} alt={`Bukti transfer ${b.tagihan.judul}`} className="max-h-72 w-auto max-w-full rounded-xl border border-line object-contain" />
                      </a>
                    ) : (
                      <a href={`/api/bukti/${b.bukti.id}`} target="_blank" rel="noopener noreferrer" className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
                        <FileText className="size-4" aria-hidden="true" />
                        Buka PDF bukti
                      </a>
                    )}
                    <p className="mt-2 text-xs text-muted-fg">Periksa nominal, tanggal, dan rekening tujuan. Bukti bukan jaminan dana sudah masuk.</p>
                  </div>
                )}

                <div className="mt-5 border-t border-line pt-4">
                  {bolehVerifikasi ? (
                    <AksiVerifikasi id={b.id} ringkas={`${b.tagihan.judul}, rumah ${kodeRumah(b.tagihan.rumah)}, ${formatRupiah(b.nominal)}.`} />
                  ) : (
                    <p className="text-sm text-muted-fg">Hanya bendahara yang dapat memverifikasi.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
          <form method="get" className="mb-5 flex flex-wrap gap-2.5">
            <input type="hidden" name="tampil" value="riwayat" />
            <select name="status" defaultValue={p.status ?? ""} aria-label="Saring status" className={`${KELAS_ISIAN} w-auto`}>
              <option value="">Semua status</option>
              {(Object.keys(LABEL) as (keyof typeof LABEL)[]).map((k) => (
                <option key={k} value={k}>{LABEL[k]}</option>
              ))}
            </select>
            <button type="submit" className={TOMBOL_UTAMA}>Terapkan</button>
          </form>

          {data!.baris.length === 0 ? (
            <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada pembayaran.</p>
          ) : (
            <DaftarResponsif
              label="Riwayat pembayaran"
              baris={data!.baris}
              kunci={(b) => b.id}
              kolom={[
                { judul: "Tagihan", utama: true, sel: (b) => <>{kodeRumah(b.tagihan.rumah)} · {b.tagihan.judul}</> },
                { judul: "Nominal", kanan: true, sel: (b) => <strong>{formatRupiah(b.nominal)}</strong> },
                { judul: "Metode", sel: (b) => (b.metode === "TUNAI" ? "Tunai" : "Transfer") },
                { judul: "Tanggal", sel: (b) => formatTanggal(isoDari(b.tanggalBayar)) },
                {
                  judul: "Status",
                  sel: (b) => (
                    <>
                      <Lencana nada={NADA[b.status]}>{LABEL[b.status]}</Lencana>
                      {b.status === "REJECTED" && b.alasanTolak && <span className="mt-1 block text-xs text-muted-fg">{b.alasanTolak}</span>}
                      {b.status === "VOIDED" && b.dibatalkanAlasan && <span className="mt-1 block text-xs text-muted-fg">{b.dibatalkanAlasan}</span>}
                    </>
                  ),
                },
              ]}
              aksi={(b) => (
                <>
                  {b.kuitansi && <Link href={`/admin/kuitansi/${b.kuitansi.id}`} className="text-sm font-semibold text-hijau underline-offset-4 hover:underline">Kuitansi</Link>}
                  {b.bukti && <a href={`/api/bukti/${b.bukti.id}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-hijau underline-offset-4 hover:underline">Bukti</a>}
                  {b.status === "VERIFIED" && bolehVerifikasi && <AksiBatalkanPembayaran id={b.id} />}
                </>
              )}
            />
          )}
          <Paginasi jalur="/admin/pembayaran" halaman={nomor} total={data!.total} perHalaman={PER_HALAMAN_PEMBAYARAN} params={{ tampil: "riwayat", status: p.status }} />
        </>
      )}
    </div>
  );
}
