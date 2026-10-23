import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarPengaduan, PER_HALAMAN_KOM, pengaduanSaya } from "@/lib/komunikasi-kueri";
import { nomorHalaman } from "@/lib/warga";
import { kodeRumah } from "@/lib/warga-label";
import { LABEL_KATEGORI_PENGADUAN, LABEL_STATUS_PENGADUAN, NADA_PENGADUAN } from "@/lib/komunikasi-label";
import { isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { cn } from "@/lib/utils";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaduan" };

export default async function HalamanPengaduan({ searchParams }: { searchParams: Promise<{ status?: string; halaman?: string }> }) {
  const s = await wajibMasuk();
  const peran = peranPengguna(s);
  const admin = punya(peran, "complaints.read");
  if (!admin && !punya(peran, "complaints.create.own")) redirect("/admin");

  if (!admin) {
    const saya = await pengaduanSaya(s.user.id);
    return (
      <div className="max-w-3xl">
        <JudulHalaman
          judul="Pengaduan saya"
          keterangan="Laporkan masalah lingkungan dan pantau penanganannya."
          aksi={<Link href="/admin/pengaduan/baru" className={TOMBOL_UTAMA}><Plus className="size-4" aria-hidden="true" />Buat pengaduan</Link>}
        />
        {saya.length === 0 ? (
          <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada pengaduan.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {saya.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/pengaduan/${x.id}`} className={`${KARTU} block transition-colors hover:border-jingga/60`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-muted-fg">{x.nomor}</p>
                      <p className="font-semibold text-hijau">{x.judul}</p>
                      <p className="mt-0.5 text-sm text-muted-fg">{LABEL_KATEGORI_PENGADUAN[x.kategori]} · {formatTanggal(isoDari(x.dibuatPada))}</p>
                    </div>
                    <Lencana nada={NADA_PENGADUAN[x.status]}>{LABEL_STATUS_PENGADUAN[x.status]}</Lencana>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const p = await searchParams;
  const status = p.status ?? "AKTIF";
  const nomor = nomorHalaman(p.halaman);
  const data = await daftarPengaduan({ status: status === "SEMUA" ? undefined : status, halaman: nomor });
  const baris = data.baris;
  const tab = (label: string, nilai: string) => (
    <Link
      href={`/admin/pengaduan?status=${nilai}`}
      aria-current={status === nilai ? "page" : undefined}
      className={cn("rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors", status === nilai ? "bg-hijau text-krem" : "text-hijau hover:bg-krem-2")}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-5xl">
      <JudulHalaman judul="Pengaduan" keterangan="Laporan warga. Tidak pernah ditampilkan kepada warga lain." />
      <nav aria-label="Saring status" className="mb-5 flex flex-wrap gap-2">
        {tab("Perlu ditangani", "AKTIF")}
        {tab("Baru", "BARU")}
        {tab("Diproses", "DIPROSES")}
        {tab("Selesai", "SELESAI")}
        {tab("Ditutup", "DITUTUP")}
        {tab("Semua", "SEMUA")}
      </nav>
      {baris.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Tidak ada pengaduan pada kategori ini.</p>
      ) : (
        <DaftarResponsif
          label="Daftar pengaduan"
          baris={baris}
          kunci={(x) => x.id}
          kolom={[
            {
              judul: "Pengaduan",
              utama: true,
              sel: (x) => (
                <Link href={`/admin/pengaduan/${x.id}`} className="underline-offset-4 hover:underline">
                  {x.judul}
                  <span className="mt-0.5 block font-mono text-xs font-normal text-muted-fg">{x.nomor}</span>
                </Link>
              ),
            },
            { judul: "Kategori", sel: (x) => LABEL_KATEGORI_PENGADUAN[x.kategori] },
            { judul: "Pelapor", sel: (x) => `${x.pelaporNama}${x.rumah ? ` (${kodeRumah(x.rumah)})` : ""}` },
            { judul: "Tanggal", sel: (x) => formatTanggal(isoDari(x.dibuatPada)) },
            { judul: "Penanggung jawab", sel: (x) => x.penanggungJawab ?? "—" },
            { judul: "Status", sel: (x) => <Lencana nada={NADA_PENGADUAN[x.status]}>{LABEL_STATUS_PENGADUAN[x.status]}</Lencana> },
          ]}
        />
      )}
      <Paginasi jalur="/admin/pengaduan" halaman={nomor} total={data.total} perHalaman={PER_HALAMAN_KOM} params={{ status }} />
    </div>
  );
}
