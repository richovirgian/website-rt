import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, Plus, Search, Upload, UserPlus } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { punya } from "@/lib/izin";
import { daftarWarga, nomorHalaman, PER_HALAMAN, TAB_WARGA, type TabWarga } from "@/lib/warga";
import { kodeRumah, LABEL_DOMISILI, LABEL_HUBUNGAN } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { Lencana } from "@/components/cms/lencana";
import { TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Warga" };

const LABEL_TAB: Record<TabWarga, string> = { SEMUA: "Semua", TETAP: "Tetap", KONTRAK: "Kontrak", PINDAH: "Pindah" };
const NADA_AVATAR = ["bg-[#e6f0ec] text-[#1f5f4a]", "bg-[#fdf0e3] text-[#9a4a0b]", "bg-[#eaf0fe] text-[#1e40af]", "bg-[#f3eefb] text-[#6b3fa0]", "bg-[#f0efee] text-[#44403c]"];

const inisial = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((k) => k[0]!.toUpperCase())
    .join("");

function Avatar({ nama, ukuran }: { nama: string; ukuran: "kecil" | "besar" }) {
  const nada = NADA_AVATAR[(nama.charCodeAt(0) + nama.length) % NADA_AVATAR.length];
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-full font-semibold", ukuran === "kecil" ? "size-10 text-sm" : "size-11 text-sm", nada)}>
      {inisial(nama)}
    </span>
  );
}

type Hunian = "PEMILIK" | "PENYEWA" | "LAINNYA";
function StatusWarga({ domisili, hunian }: { domisili: keyof typeof LABEL_DOMISILI; hunian: Hunian }) {
  if (domisili !== "AKTIF") return <Lencana nada="abu">{domisili === "PINDAH" ? "Pindah" : LABEL_DOMISILI[domisili]}</Lencana>;
  if (hunian === "PEMILIK") return <Lencana nada="hijau">Tetap</Lencana>;
  if (hunian === "PENYEWA") return <Lencana nada="biru">Kontrak</Lencana>;
  return <Lencana nada="abu">Lainnya</Lencana>;
}

export default async function HalamanWarga({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; halaman?: string }>;
}) {
  const s = await wajibIzin("residents.read");
  const { q: qMentah, status: statusMentah, halaman } = await searchParams;
  const q = qMentah?.trim() || undefined;
  const nomor = nomorHalaman(halaman);
  const identitas = punya(s.peran, "residents.read_identity");
  const denganIuran = punya(s.peran, "bills.read");
  const { baris, total, iuran, hitung, statistik } = await daftarWarga({ q, status: statusMentah, halaman: nomor, identitas, denganIuran });
  const tab: TabWarga = (TAB_WARGA as readonly string[]).includes(statusMentah ?? "") ? (statusMentah as TabWarga) : "SEMUA";

  const href = (p: { status?: string; halaman?: number }) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    const st = p.status ?? (tab === "SEMUA" ? undefined : tab);
    if (st && st !== "SEMUA") u.set("status", st);
    if (p.halaman && p.halaman > 1) u.set("halaman", String(p.halaman));
    const t = u.toString();
    return `/admin/warga${t ? `?${t}` : ""}`;
  };
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));
  const dari = total === 0 ? 0 : (nomor - 1) * PER_HALAMAN + 1;
  const sampai = (nomor - 1) * PER_HALAMAN + baris.length;

  const statistikKartu: { judul: string; nilai: number; tautan?: { href: string; label: string }; peringatan?: boolean }[] = [
    { judul: "Warga aktif", nilai: statistik.aktif },
    { judul: "Kepala keluarga", nilai: statistik.kepala },
    { judul: "Rumah terisi", nilai: statistik.rumahTerisi },
    ...(denganIuran ? [{ judul: "Rumah menunggak iuran", nilai: statistik.rumahNunggak, peringatan: statistik.rumahNunggak > 0, tautan: { href: "/admin/tagihan", label: "lihat" } }] : []),
  ];

  return (
    <div>
      <JudulHalaman
        judul="Warga"
        keterangan="Data warga di seluruh rumah. Tambah manual satu per satu, atau impor banyak sekaligus dari CSV."
        aksi={
          <>
            {punya(s.peran, "residents.export") && (
              <a href="/api/warga/ekspor" className={`${TOMBOL_SEKUNDER} max-sm:w-11 max-sm:px-0`}>
                <Download className="size-4" aria-hidden="true" />
                <span className="max-sm:sr-only">Ekspor CSV</span>
              </a>
            )}
            {punya(s.peran, "residents.create") && (
              <>
                <Link href="/admin/warga/impor" className={`${TOMBOL_SEKUNDER} max-sm:w-11 max-sm:px-0`}>
                  <Upload className="size-4" aria-hidden="true" />
                  <span className="max-sm:sr-only">Impor CSV</span>
                </Link>
                <Link href="/admin/warga/baru" className={TOMBOL_UTAMA}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah warga
                </Link>
              </>
            )}
          </>
        }
      />

      <section aria-label="Ringkasan warga" className="mb-5 grid grid-cols-2 overflow-hidden rounded-[14px] border border-line-strong bg-surface lg:grid-cols-4">
        {statistikKartu.map((k, i) => (
          <div key={k.judul} className={cn("flex flex-col gap-1 border-line px-4 py-3 sm:gap-1.5 sm:px-[18px] sm:py-4", i % 2 === 0 && "border-r", i < 2 && "border-b lg:border-b-0", "lg:border-r lg:last:border-r-0")}>
            <div className="text-sm text-muted-fg">{k.judul}</div>
            <div className="flex items-baseline gap-2">
              <span className={cn("font-semibold tabular-nums tracking-[-0.02em] text-[26px] sm:text-[32px]", k.peringatan ? "text-[#b45309]" : "text-hijau-tua")}>{k.nilai}</span>
              {k.tautan && k.nilai > 0 && (
                <Link href={k.tautan.href} className="text-xs text-muted-fg underline-offset-4 hover:underline">
                  {k.tautan.label}
                </Link>
              )}
            </div>
          </div>
        ))}
      </section>

      <section aria-label="Daftar warga" className="overflow-hidden rounded-[14px] border border-line-strong bg-surface">
        <div className="flex flex-col gap-2.5 border-b border-line p-3 lg:flex-row lg:flex-wrap lg:items-center">
          <nav aria-label="Saring status" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 lg:mx-0 lg:gap-0.5 lg:rounded-[11px] lg:bg-krem-2 lg:p-1 lg:px-1">
            {TAB_WARGA.map((t) => {
              const aktif = t === tab;
              return (
                <Link
                  key={t}
                  href={href({ status: t })}
                  aria-current={aktif ? "page" : undefined}
                  className={cn(
                    "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] transition-colors lg:h-9 lg:rounded-lg lg:border-transparent lg:px-3.5",
                    aktif
                      ? "border-[var(--side)] bg-[var(--side)] font-medium text-white lg:bg-surface lg:text-hijau-tua lg:shadow-[0_1px_2px_rgba(28,25,23,.08),0_0_0_1px_var(--desa-line-strong)]"
                      : "border-line-strong bg-surface text-[#44403c] hover:bg-krem-2 lg:bg-transparent lg:text-[#57534e]",
                  )}
                >
                  {LABEL_TAB[t]}
                  <span className="font-mono-geist text-[11px] opacity-70">{hitung[t]}</span>
                </Link>
              );
            })}
          </nav>
          <form method="get" role="search" className="flex min-w-0 flex-1 gap-2 lg:min-w-[220px]">
            {tab !== "SEMUA" && <input type="hidden" name="status" value={tab} />}
            <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[12px] border border-line-strong bg-surface px-3.5 focus-within:border-hijau focus-within:ring-2 focus-within:ring-hijau/25 lg:rounded-[10px]">
              <Search className="size-[18px] shrink-0 text-muted-fg" aria-hidden="true" />
              <span className="sr-only">Cari warga</span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder={identitas ? "Cari nama, rumah, atau NIK" : "Cari nama atau rumah"}
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#8a8580] lg:text-[15px]"
              />
            </label>
            <button type="submit" className={TOMBOL_SEKUNDER}>Cari</button>
          </form>
        </div>

        {baris.length === 0 ? (
          <div className="flex flex-col items-center gap-3.5 px-6 py-14 text-center">
            <div className="grid size-[52px] place-items-center rounded-[14px] border border-line-strong bg-krem-2 text-hijau">
              <UserPlus className="size-6" aria-hidden="true" />
            </div>
            <div className="max-w-md">
              <p className="text-base font-semibold text-hijau-tua">{q || tab !== "SEMUA" ? "Tidak ada warga yang cocok" : "Belum ada warga terdaftar"}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">
                {q || tab !== "SEMUA" ? "Coba kata kunci lain atau ganti filter status." : "Tambahkan warga satu per satu, atau impor dari CSV untuk mulai cepat."}
              </p>
            </div>
            {!q && tab === "SEMUA" && punya(s.peran, "residents.create") && (
              <div className="mt-1 flex flex-wrap justify-center gap-2">
                <Link href="/admin/warga/baru" className={TOMBOL_UTAMA}>Tambah warga</Link>
                <Link href="/admin/warga/impor" className={TOMBOL_SEKUNDER}>Impor dari CSV</Link>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Ponsel: daftar */}
            <ul aria-label="Daftar warga" className="lg:hidden">
              {baris.map((w) => (
                <li key={w.id} className="border-b border-line last:border-b-0">
                  <Link href={`/admin/warga/${w.id}`} className="flex min-h-14 items-center gap-3 px-3.5 py-3 text-hijau-tua no-underline hover:bg-[rgba(28,25,23,.035)]">
                    <Avatar nama={w.namaLengkap} ukuran="besar" />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-medium">{w.namaLengkap}</span>
                      <span className="flex items-center gap-2 text-[12.5px] text-muted-fg">
                        <span className="font-mono-geist text-[#44403c]">{kodeRumah(w.keluarga.rumah)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{LABEL_HUBUNGAN[w.hubungan]}</span>
                      </span>
                    </span>
                    <StatusWarga domisili={w.statusDomisili} hunian={w.keluarga.statusHunian} />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Layar lebar: tabel */}
            <div className="hidden overflow-x-auto lg:block">
              <table aria-label="Daftar warga" className="w-full min-w-[900px] text-left text-[15px]">
                <thead className="bg-krem-2 text-[13px] font-medium text-muted-fg">
                  <tr className="h-12">
                    <th scope="col" className="px-4">Nama</th>
                    <th scope="col" className="px-2">Rumah</th>
                    <th scope="col" className="px-2">Hubungan</th>
                    <th scope="col" className="px-2">Status</th>
                    <th scope="col" className="px-2">Kontak</th>
                    {denganIuran && <th scope="col" className="px-2">Iuran</th>}
                    <th scope="col" className="w-12 px-2"><span className="sr-only">Buka</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {baris.map((w) => {
                    const info = iuran.get(w.keluarga.rumah.id);
                    const nunggak = info?.nunggak ?? 0;
                    const kepala = w.hubungan === "KEPALA_KELUARGA";
                    return (
                      <tr key={w.id} className="h-[68px] transition-colors hover:bg-[rgba(28,25,23,.035)]">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <Avatar nama={w.namaLengkap} ukuran="kecil" />
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <Link href={`/admin/warga/${w.id}`} className="text-[15px] font-medium text-hijau-tua no-underline hover:underline">
                                {w.namaLengkap}
                              </Link>
                              {identitas && "nikAkhir4" in w && (
                                <span className="font-mono-geist text-[13px] text-muted-fg">{w.nikAkhir4 ? `•••• •••• •••• ${w.nikAkhir4}` : "NIK belum diisi"}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-2">
                          <Link href={`/admin/rumah/${w.keluarga.rumah.id}`} className="font-mono-geist rounded-md border border-line-strong bg-krem-2 px-2.5 py-1 text-[13px] font-medium text-hijau-tua no-underline hover:border-hijau">
                            {kodeRumah(w.keluarga.rumah)}
                          </Link>
                        </td>
                        <td className="px-2 text-[14px] text-[#44403c]">{LABEL_HUBUNGAN[w.hubungan]}</td>
                        <td className="px-2"><StatusWarga domisili={w.statusDomisili} hunian={w.keluarga.statusHunian} /></td>
                        <td className="font-mono-geist px-2 text-[13.5px] text-[#44403c]">{w.noHp ?? "—"}</td>
                        {denganIuran && (
                          <td className={cn("px-2 text-[14px]", nunggak > 0 ? "font-semibold text-[#b45309]" : "text-[#a8a29e]", kepala && nunggak === 0 && info?.ada && "font-normal text-hijau")}>
                            {!kepala || !info ? "—" : nunggak > 0 ? `Nunggak ${nunggak} bln` : info.ada ? "Lunas" : "—"}
                          </td>
                        )}
                        <td className="px-2 text-center">
                          <Link href={`/admin/warga/${w.id}`} aria-label={`Buka ${w.namaLengkap}`} className="grid size-9 place-items-center rounded-lg text-muted-fg hover:bg-black/[0.06]">
                            <ChevronRight className="size-4" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-line px-4 py-3.5 text-sm text-muted-fg">
              <p>
                Menampilkan <span className="font-medium text-hijau-tua">{dari}–{sampai}</span> dari {total} warga
              </p>
              {jumlahHalaman > 1 && (
                <nav aria-label="Halaman" className="flex items-center gap-1.5">
                  {nomor > 1 ? (
                    <Link href={href({ halaman: nomor - 1 })} className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-surface px-3 text-hijau-tua hover:bg-krem-2 sm:min-h-8">Sebelumnya</Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-surface px-3 text-[#a8a29e] sm:min-h-8">Sebelumnya</span>
                  )}
                  <span className="px-1">Halaman {nomor} dari {jumlahHalaman}</span>
                  {nomor < jumlahHalaman ? (
                    <Link href={href({ halaman: nomor + 1 })} className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-surface px-3 text-hijau-tua hover:bg-krem-2 sm:min-h-8">Berikutnya</Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center rounded-lg border border-line-strong bg-surface px-3 text-[#a8a29e] sm:min-h-8">Berikutnya</span>
                  )}
                </nav>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
