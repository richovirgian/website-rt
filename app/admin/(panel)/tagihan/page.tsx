import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import {
  daftarTagihan,
  jenisIuranAktif,
  PER_HALAMAN_TAGIHAN,
  periodeTersedia,
  ringkasanTagihan,
  tunggakanPerRumah,
} from "@/lib/iuran-kueri";
import { nomorHalaman } from "@/lib/warga";
import { kodeRumah } from "@/lib/warga-label";
import { LABEL_STATUS } from "@/lib/iuran-label";
import { NADA_STATUS, statusTampil } from "@/lib/tagihan-tampil";
import { formatRupiah, hariIni, isoDari, labelPeriode } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { cn } from "@/lib/utils";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { TombolBatalkan } from "@/components/cms/tombol-batalkan";
import { TombolTunai } from "@/components/cms/tombol-tunai";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { KELAS_ISIAN, KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tagihan" };

type Params = { q?: string; status?: string; periode?: string; jenis?: string; halaman?: string; tampil?: string };

export default async function HalamanTagihan({ searchParams }: { searchParams: Promise<Params> }) {
  const s = await wajibIzin("bills.read");
  const p = await searchParams;
  const nomor = nomorHalaman(p.halaman);
  const tunggakan = p.tampil === "tunggakan";
  const hari = hariIni();

  const [ringkas, jenis, periode] = await Promise.all([ringkasanTagihan(), jenisIuranAktif(), periodeTersedia()]);
  const data = tunggakan ? null : await daftarTagihan({ q: p.q?.trim() || undefined, status: p.status, periode: p.periode, jenisId: p.jenis, halaman: nomor });
  const rekap = tunggakan ? await tunggakanPerRumah() : [];

  const kartu: { label: string; jumlah: number; total: number; merah?: boolean }[] = [
    { label: "Belum dibayar", ...ringkas.belumLunas },
    { label: "Terlambat", ...ringkas.terlambat, merah: true },
    { label: "Lunas", ...ringkas.lunas },
  ];
  const tab = (label: string, tampil?: string) => (
    <Link
      href={tampil ? `/admin/tagihan?tampil=${tampil}` : "/admin/tagihan"}
      aria-current={(tampil === "tunggakan") === tunggakan ? "page" : undefined}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
        (tampil === "tunggakan") === tunggakan ? "bg-hijau text-krem" : "text-hijau hover:bg-krem-2",
      )}
    >
      {label}
    </Link>
  );

  return (
    <div>
      <JudulHalaman
        judul="Tagihan"
        keterangan="Tagihan iuran per rumah. Tagihan lunas setelah pembayaran diverifikasi bendahara atau dicatat tunai."
        aksi={
          punya(s.peran, "bills.create") && (
            <Link href="/admin/tagihan/terbitkan" className={TOMBOL_UTAMA}>
              <Plus className="size-4" aria-hidden="true" />
              Terbitkan tagihan
            </Link>
          )
        }
      />

      <ul className="mb-8 grid gap-4 sm:grid-cols-3">
        {kartu.map((k) => (
          <li key={k.label} className={KARTU}>
            <p className="text-sm text-muted-fg">{k.label}</p>
            <p className={cn("mt-1 text-2xl font-bold", k.merah && k.jumlah > 0 ? "text-red-700" : "text-hijau")}>{formatRupiah(k.total)}</p>
            <p className="mt-0.5 text-sm text-muted-fg">{k.jumlah} tagihan</p>
          </li>
        ))}
      </ul>

      <nav aria-label="Tampilan" className="mb-5 flex gap-2">
        {tab("Daftar tagihan")}
        {tab("Tunggakan per rumah", "tunggakan")}
      </nav>

      {tunggakan ? (
        rekap.length === 0 ? (
          <p className={`${KARTU} text-sm text-muted-fg`}>Tidak ada tagihan yang belum dibayar.</p>
        ) : (
          <DaftarResponsif
            label="Tunggakan per rumah"
            baris={rekap}
            kunci={(r) => r.rumah.id}
            kolom={[
              {
                judul: "Rumah",
                utama: true,
                sel: (r) => (
                  <Link href={`/admin/tagihan?q=${kodeRumah(r.rumah)}`} className="underline-offset-4 hover:underline">
                    {kodeRumah(r.rumah)}
                  </Link>
                ),
              },
              { judul: "Tagihan", sel: (r) => r.jumlah },
              { judul: "Total belum dibayar", kanan: true, sel: (r) => <strong>{formatRupiah(r.total)}</strong> },
              {
                judul: "Tertua jatuh tempo",
                sel: (r) => (
                  <>
                    {r.tertua ? formatTanggal(isoDari(r.tertua)) : "—"}
                    {r.terlambat && <span className="ml-2"><Lencana nada="merah">Terlambat</Lencana></span>}
                  </>
                ),
              },
            ]}
          />
        )
      ) : (
        <>
          <form method="get" role="search" className="mb-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]">
            <input type="search" name="q" defaultValue={p.q} placeholder="Cari rumah atau judul" aria-label="Cari rumah atau judul" className={KELAS_ISIAN} />
            <select name="status" defaultValue={p.status ?? ""} aria-label="Status" className={`${KELAS_ISIAN} lg:w-auto`}>
              <option value="">Semua status</option>
              {(["UNPAID", "TERLAMBAT", "PAID", "CANCELLED"] as const).map((x) => (
                <option key={x} value={x}>{LABEL_STATUS[x]}</option>
              ))}
            </select>
            <select name="periode" defaultValue={p.periode ?? ""} aria-label="Periode" className={`${KELAS_ISIAN} lg:w-auto`}>
              <option value="">Semua periode</option>
              {periode.map((x) => (
                <option key={x} value={x}>{labelPeriode(x)}</option>
              ))}
            </select>
            <select name="jenis" defaultValue={p.jenis ?? ""} aria-label="Jenis iuran" className={`${KELAS_ISIAN} lg:w-auto`}>
              <option value="">Semua iuran</option>
              {jenis.map((x) => (
                <option key={x.id} value={x.id}>{x.nama}</option>
              ))}
            </select>
            <button type="submit" className={TOMBOL_UTAMA}>Terapkan</button>
          </form>

          {data!.baris.length === 0 ? (
            <p className={`${KARTU} text-sm text-muted-fg`}>
              {p.q || p.status || p.periode || p.jenis ? "Tidak ada tagihan yang cocok." : "Belum ada tagihan. Terbitkan yang pertama."}
            </p>
          ) : (
            <DaftarResponsif
              label="Daftar tagihan"
              baris={data!.baris}
              kunci={(t) => t.id}
              kolom={[
                {
                  judul: "Tagihan",
                  utama: true,
                  sel: (t) => (
                    <>
                      {kodeRumah(t.rumah)} · {t.judul}
                      {t.status === "CANCELLED" && t.dibatalkanAlasan && (
                        <span className="mt-0.5 block text-xs font-normal text-muted-fg">Alasan: {t.dibatalkanAlasan}</span>
                      )}
                    </>
                  ),
                },
                { judul: "Nominal", kanan: true, sel: (t) => <strong>{formatRupiah(t.nominal)}</strong> },
                { judul: "Jatuh tempo", sel: (t) => formatTanggal(isoDari(t.jatuhTempo)) },
                {
                  judul: "Status",
                  sel: (t) => {
                    const st = statusTampil(t.status, t.jatuhTempo, hari);
                    return <Lencana nada={NADA_STATUS[st]}>{LABEL_STATUS[st]}</Lencana>;
                  },
                },
              ]}
              aksi={(t) => (
                <>
                  {t.status === "UNPAID" && punya(s.peran, "payments.record_cash") && (
                    <TombolTunai id={t.id} judul={t.judul} nominal={formatRupiah(t.nominal)} />
                  )}
                  {t.status === "UNPAID" && punya(s.peran, "bills.cancel") && <TombolBatalkan id={t.id} judul={t.judul} />}
                  {t.status === "PAID" && t.pembayaran[0]?.kuitansi && (
                    <Link href={`/admin/kuitansi/${t.pembayaran[0].kuitansi.id}`} className="text-sm font-semibold text-hijau underline-offset-4 hover:underline">
                      Kuitansi
                    </Link>
                  )}
                </>
              )}
            />
          )}
          <Paginasi jalur="/admin/tagihan" halaman={nomor} total={data!.total} perHalaman={PER_HALAMAN_TAGIHAN} params={{ q: p.q, status: p.status, periode: p.periode, jenis: p.jenis }} />
        </>
      )}
    </div>
  );
}
