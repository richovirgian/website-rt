import type { Metadata } from "next";
import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { siapkanKategoriBawaan } from "@/lib/kas";
import {
  bulanSah,
  daftarKas,
  kategoriKasAktif,
  PER_HALAMAN_PEMBAYARAN,
  rekapBulanan,
  rekapKategori,
  ringkasanKas,
} from "@/lib/pembayaran-kueri";
import { nomorHalaman } from "@/lib/warga";
import { formatRupiah, isoDari, labelPeriode } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { BatangBulanan } from "@/components/cms/batang-bulanan";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { FormCatatKas, FormKategoriKas, TombolKoreksiKas } from "@/components/cms/form-kas";
import { KARTU, KELAS_ISIAN, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kas" };

export default async function HalamanKas({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string; jenis?: string; halaman?: string }>;
}) {
  const s = await wajibIzin("finance.read");
  const p = await searchParams;
  const bulan = bulanSah(p.bulan) ? p.bulan : undefined;
  const nomor = nomorHalaman(p.halaman);
  const bolehCatat = punya(s.peran, "finance.create");
  const bolehKoreksi = punya(s.peran, "finance.reverse");

  // Kategori bawaan disiapkan sekali saat halaman dibuka oleh yang berhak mencatat.
  if (bolehCatat) await db().$transaction((tx) => siapkanKategoriBawaan(tx));

  const [ringkas, rekap, perKategori, data, kategori] = await Promise.all([
    ringkasanKas(),
    rekapBulanan(),
    rekapKategori(bulan),
    daftarKas({ bulan, jenis: p.jenis, halaman: nomor }),
    bolehCatat ? kategoriKasAktif() : Promise.resolve([]),
  ]);

  const kartu = [
    { label: "Saldo kas", nilai: ringkas.saldo, besar: true },
    { label: `Masuk ${labelPeriode(ringkas.bulanIni)}`, nilai: ringkas.masukBulan },
    { label: `Keluar ${labelPeriode(ringkas.bulanIni)}`, nilai: ringkas.keluarBulan },
  ];

  return (
    <div className="max-w-5xl">
      <JudulHalaman
        judul="Kas"
        keterangan="Buku kas RT. Saldo dihitung dari seluruh transaksi, dan catatan lama tidak pernah diubah atau dihapus; kesalahan dikoreksi dengan transaksi pembalik."
        aksi={
          punya(s.peran, "reports.export") && (
            <a href={`/api/kas/ekspor${bulan ? `?bulan=${bulan}` : ""}`} className={TOMBOL_SEKUNDER}>
              <Download className="size-4" aria-hidden="true" />
              Ekspor CSV
            </a>
          )
        }
      />

      <ul className="mb-8 grid gap-4 sm:grid-cols-3">
        {kartu.map((k) => (
          <li key={k.label} className={KARTU}>
            <p className="text-sm text-muted-fg">{k.label}</p>
            <p className={`mt-1 font-bold ${k.besar ? "text-3xl text-hijau" : "text-2xl text-hijau-tua"}`}>{formatRupiah(k.nilai)}</p>
          </li>
        ))}
      </ul>

      {bolehCatat && (
        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <details className={`${KARTU} group`}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
              <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
              Catat pengeluaran atau pemasukan lain
            </summary>
            <div className="mt-5"><FormCatatKas kategori={kategori} /></div>
          </details>
          <details className={`${KARTU} group`}>
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-hijau marker:hidden [&::-webkit-details-marker]:hidden">
              <Plus className="size-4 transition-transform group-open:rotate-45" aria-hidden="true" />
              Tambah kategori
            </summary>
            <div className="mt-5"><FormKategoriKas /></div>
          </details>
        </div>
      )}

      <section aria-labelledby="judul-rekap" className={`${KARTU} mb-8`}>
        <h2 id="judul-rekap" className="mb-4 text-lg font-bold text-hijau">Rekap bulanan</h2>
        {rekap.length === 0 ? <p className="text-sm text-muted-fg">Belum ada transaksi.</p> : <BatangBulanan data={rekap} labelBulan={labelPeriode} />}
      </section>

      <section aria-labelledby="judul-kategori" className={`${KARTU} mb-8`}>
        <h2 id="judul-kategori" className="mb-1 text-lg font-bold text-hijau">Per kategori</h2>
        <p className="mb-4 text-sm text-muted-fg">{bulan ? labelPeriode(bulan) : "Semua waktu"}. Ubah bulan di saringan di bawah.</p>
        {perKategori.length === 0 ? (
          <p className="text-sm text-muted-fg">Tidak ada transaksi.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {perKategori.map((k) => (
              <li key={`${k.nama}-${k.jenis}`} className="flex min-h-11 items-center justify-between gap-3 py-2">
                <span className="text-hijau-tua">{k.nama} <span className="text-muted-fg">· {k.jenis === "MASUK" ? "masuk" : "keluar"}</span></span>
                <span className="font-semibold tabular-nums text-hijau-tua">{formatRupiah(k.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="judul-transaksi">
        <h2 id="judul-transaksi" className="mb-3 text-lg font-bold text-hijau">Transaksi</h2>
        <form method="get" role="search" className="mb-4 flex flex-wrap gap-2.5">
          <input type="month" name="bulan" defaultValue={bulan} aria-label="Bulan" className={`${KELAS_ISIAN} w-auto`} />
          <select name="jenis" defaultValue={p.jenis ?? ""} aria-label="Jenis" className={`${KELAS_ISIAN} w-auto`}>
            <option value="">Masuk dan keluar</option>
            <option value="MASUK">Hanya masuk</option>
            <option value="KELUAR">Hanya keluar</option>
          </select>
          <button type="submit" className={TOMBOL_UTAMA}>Terapkan</button>
          {(bulan || p.jenis) && <Link href="/admin/kas" className={TOMBOL_SEKUNDER}>Reset</Link>}
        </form>

        {data.baris.length === 0 ? (
          <p className={`${KARTU} text-sm text-muted-fg`}>Tidak ada transaksi.</p>
        ) : (
          <DaftarResponsif
            label="Transaksi kas"
            baris={data.baris}
            kunci={(t) => t.id}
            kolom={[
              {
                judul: "Keterangan",
                utama: true,
                sel: (t) => (
                  <>
                    {t.deskripsi}
                    <span className="mt-0.5 block text-xs font-normal text-muted-fg">{t.nomor} · {t.kategori.nama}</span>
                  </>
                ),
              },
              { judul: "Tanggal", sel: (t) => formatTanggal(isoDari(t.tanggal)) },
              {
                judul: "Nominal",
                kanan: true,
                sel: (t) => (
                  <strong className={t.jenis === "MASUK" ? "text-hijau" : "text-red-700"}>
                    {t.jenis === "MASUK" ? "+" : "−"}{formatRupiah(t.nominal)}
                  </strong>
                ),
              },
              {
                judul: "Catatan",
                sel: (t) => (
                  <span className="flex flex-wrap justify-end gap-1.5 md:justify-start">
                    {t.pembayaranId && <Lencana nada="hijau">Dari pembayaran</Lencana>}
                    {t.koreksiDariId && <Lencana nada="abu">Koreksi</Lencana>}
                    {t.koreksi && <Lencana nada="jingga">Dikoreksi {t.koreksi.nomor}</Lencana>}
                    {!t.pembayaranId && !t.koreksiDariId && !t.koreksi && <span className="text-muted-fg">{t.dicatatOleh}</span>}
                  </span>
                ),
              },
            ]}
            aksi={(t) => bolehKoreksi && !t.pembayaranId && !t.koreksiDariId && !t.koreksi ? <TombolKoreksiKas id={t.id} nomor={t.nomor} /> : null}
          />
        )}
        <Paginasi jalur="/admin/kas" halaman={nomor} total={data.total} perHalaman={PER_HALAMAN_PEMBAYARAN} params={{ bulan, jenis: p.jenis }} />
      </section>
    </div>
  );
}
