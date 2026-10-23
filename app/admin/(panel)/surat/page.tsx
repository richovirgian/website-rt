import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Settings2 } from "lucide-react";
import { peranPengguna, wajibMasuk } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarSurat, PER_HALAMAN_KOM, suratSaya } from "@/lib/komunikasi-kueri";
import { nomorHalaman } from "@/lib/warga";
import { kodeRumah } from "@/lib/warga-label";
import { LABEL_STATUS_SURAT, NADA_SURAT } from "@/lib/komunikasi-label";
import { isoDari } from "@/lib/uang";
import { formatTanggal } from "@/lib/profil";
import { cn } from "@/lib/utils";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";
import { Paginasi } from "@/components/cms/paginasi";
import { Lencana } from "@/components/cms/lencana";
import { KARTU, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Surat" };

export default async function HalamanSurat({ searchParams }: { searchParams: Promise<{ status?: string; halaman?: string }> }) {
  const s = await wajibMasuk();
  const peran = peranPengguna(s);
  const admin = punya(peran, "letters.read");
  if (!admin && !punya(peran, "letters.request.own")) redirect("/admin");

  if (!admin) {
    const saya = await suratSaya(s.user.id);
    return (
      <div className="max-w-3xl">
        <JudulHalaman
          judul="Surat saya"
          keterangan="Ajukan surat pengantar RT dan pantau statusnya."
          aksi={
            <Link href="/admin/surat/baru" className={TOMBOL_UTAMA}>
              <Plus className="size-4" aria-hidden="true" />
              Ajukan surat
            </Link>
          }
        />
        {saya.length === 0 ? (
          <p className={`${KARTU} text-sm text-muted-fg`}>Belum ada pengajuan surat.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {saya.map((x) => (
              <li key={x.id}>
                <Link href={`/admin/surat/${x.id}`} className={`${KARTU} flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-jingga/60`}>
                  <div>
                    <p className="font-semibold text-hijau">{x.jenisSurat.nama}</p>
                    <p className="mt-0.5 text-sm text-muted-fg">Diajukan {formatTanggal(isoDari(x.dibuatPada))}{x.nomor && ` · ${x.nomor}`}</p>
                  </div>
                  <Lencana nada={NADA_SURAT[x.status]}>{LABEL_STATUS_SURAT[x.status]}</Lencana>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const p = await searchParams;
  const status = p.status ?? "DIAJUKAN";
  const nomor = nomorHalaman(p.halaman);
  const data = await daftarSurat({ status: status === "SEMUA" ? undefined : status, halaman: nomor });
  const tab = (label: string, nilai: string) => (
    <Link
      href={`/admin/surat?status=${nilai}`}
      aria-current={status === nilai ? "page" : undefined}
      className={cn("rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors", status === nilai ? "bg-hijau text-krem" : "text-hijau hover:bg-krem-2")}
    >
      {label}
    </Link>
  );

  return (
    <div className="max-w-5xl">
      <JudulHalaman
        judul="Pengajuan surat"
        keterangan="Periksa pengajuan warga, lalu setujui, minta revisi, atau tolak."
        aksi={
          punya(peran, "settings.manage") && (
            <Link href="/admin/surat/jenis" className={TOMBOL_SEKUNDER}>
              <Settings2 className="size-4" aria-hidden="true" />
              Jenis dan templat surat
            </Link>
          )
        }
      />
      <nav aria-label="Saring status" className="mb-5 flex flex-wrap gap-2">
        {tab("Menunggu", "DIAJUKAN")}
        {tab("Perlu revisi", "REVISI")}
        {tab("Disetujui", "DISETUJUI")}
        {tab("Ditolak", "DITOLAK")}
        {tab("Semua", "SEMUA")}
      </nav>
      {data.baris.length === 0 ? (
        <p className={`${KARTU} text-sm text-muted-fg`}>Tidak ada pengajuan pada kategori ini.</p>
      ) : (
        <DaftarResponsif
          label="Daftar pengajuan surat"
          baris={data.baris}
          kunci={(x) => x.id}
          kolom={[
            {
              judul: "Surat",
              utama: true,
              sel: (x) => (
                <Link href={`/admin/surat/${x.id}`} className="underline-offset-4 hover:underline">
                  {x.jenisSurat.nama}
                </Link>
              ),
            },
            { judul: "Pemohon", sel: (x) => `${x.pemohon.namaLengkap} (${kodeRumah(x.pemohon.keluarga.rumah)})` },
            { judul: "Diajukan", sel: (x) => formatTanggal(isoDari(x.dibuatPada)) },
            { judul: "Status", sel: (x) => <Lencana nada={NADA_SURAT[x.status]}>{LABEL_STATUS_SURAT[x.status]}</Lencana> },
          ]}
        />
      )}
      <Paginasi jalur="/admin/surat" halaman={nomor} total={data.total} perHalaman={PER_HALAMAN_KOM} params={{ status }} />
    </div>
  );
}
