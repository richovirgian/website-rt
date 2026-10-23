import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, UserCheck, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { wajibMasuk, peranPengguna } from "@/lib/cms/sesi";
import { INFO_PERAN, PERAN, punya } from "@/lib/izin";
import { profilWargaSendiri, ringkasanWarga } from "@/lib/warga";
import { ringkasanTagihan, tagihanRumahSaya } from "@/lib/iuran-kueri";
import { jumlahMenunggu, ringkasanKas } from "@/lib/pembayaran-kueri";
import { jumlahPengaduanBaru, jumlahSuratMenunggu, kegiatanTerdekat, pengumumanTerbaru } from "@/lib/komunikasi-kueri";
import { LABEL_KATEGORI_PENGUMUMAN, formatWaktu } from "@/lib/komunikasi-label";
import { formatRupiah } from "@/lib/uang";
import { kodeRumah } from "@/lib/warga-label";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ringkasan" };

/**
 * Dasbor. Setiap angka dihitung dari database. Modul yang belum dibangun
 * dinyatakan apa adanya, bukan diisi angka contoh.
 */
export default async function Ringkasan() {
  const s = await wajibMasuk();
  const peran = peranPengguna(s);

  const lihatWarga = punya(peran, "residents.read");
  const ringkas = lihatWarga ? await ringkasanWarga() : null;
  const pengguna = punya(peran, "users.manage")
    ? await db().user.groupBy({ by: ["role"], _count: { _all: true } })
    : [];
  const saya = punya(peran, "residents.read.own") ? await profilWargaSendiri(s.user.id) : null;
  const tagihan = punya(peran, "bills.read") ? await ringkasanTagihan() : null;
  const menunggu = punya(peran, "payments.read") ? await jumlahMenunggu() : null;
  const terbaru = await pengumumanTerbaru(s.user.id);
  const kegiatan = await kegiatanTerdekat();
  const antreanAdmin = punya(peran, "letters.approve")
    ? { surat: await jumlahSuratMenunggu(), aduan: await jumlahPengaduanBaru() }
    : null;
  const kas = punya(peran, "finance.read") ? await ringkasanKas() : null;
  const tagihanSaya = punya(peran, "bills.read.own") ? await tagihanRumahSaya(s.user.id) : null;
  const tagihanSayaBelum = tagihanSaya?.tagihan.filter((t) => t.status === "UNPAID") ?? [];

  const kartu = ringkas
    ? [
        { label: "Rumah", nilai: ringkas.rumah, ikon: Home, href: "/admin/rumah" },
        { label: "Keluarga yang tinggal", nilai: ringkas.keluarga, ikon: Users, href: "/admin/rumah" },
        { label: "Warga aktif", nilai: ringkas.warga, ikon: UserRound, href: "/admin/warga" },
        { label: "Warga punya akun", nilai: ringkas.akun, ikon: UserCheck, href: "/admin/warga" },
      ]
    : [];

  return (
    <div className="max-w-5xl">
      <JudulHalaman
        judul={`Halo, ${s.user.name}`}
        keterangan={`Anda masuk sebagai ${INFO_PERAN[peran].nama}.`}
      />

      {ringkas && (
        <section aria-labelledby="judul-warga" className="mb-8">
          <h2 id="judul-warga" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            Kependudukan
          </h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {kartu.map(({ label, nilai, ikon: Ikon, href }) => (
              <li key={label}>
                <Link href={href} className={`${KARTU} group block h-full transition-colors hover:border-jingga/60`}>
                  <span className="grid size-10 place-items-center rounded-xl bg-hijau/10 text-hijau">
                    <Ikon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-3xl font-bold text-hijau">{nilai}</p>
                  <p className="mt-1 flex items-center justify-between text-sm text-muted-fg">
                    {label}
                    <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {ringkas.rumah === 0 && (
            <p className="mt-4 text-sm text-muted-fg">
              Belum ada data. Mulai dengan menambah rumah, atau{" "}
              <Link href="/admin/warga/impor" className="font-semibold text-hijau underline">
                impor dari CSV
              </Link>
              .
            </p>
          )}
        </section>
      )}

      {antreanAdmin && (antreanAdmin.surat > 0 || antreanAdmin.aduan > 0) && (
        <section aria-labelledby="judul-tindakan" className="mb-8">
          <h2 id="judul-tindakan" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            Perlu tindakan
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {antreanAdmin.surat > 0 && (
              <li>
                <Link href="/admin/surat" className={`${KARTU} block h-full border-jingga/60 bg-jingga/10 transition-colors hover:bg-jingga/15`}>
                  <p className="text-3xl font-bold text-hijau">{antreanAdmin.surat}</p>
                  <p className="mt-1 text-sm text-hijau-tua">pengajuan surat menunggu persetujuan</p>
                </Link>
              </li>
            )}
            {antreanAdmin.aduan > 0 && (
              <li>
                <Link href="/admin/pengaduan" className={`${KARTU} block h-full border-jingga/60 bg-jingga/10 transition-colors hover:bg-jingga/15`}>
                  <p className="text-3xl font-bold text-hijau">{antreanAdmin.aduan}</p>
                  <p className="mt-1 text-sm text-hijau-tua">pengaduan baru belum ditangani</p>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="judul-umum" className={KARTU}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="judul-umum" className="text-lg font-bold text-hijau">Pengumuman terbaru</h2>
            <Link href="/admin/pengumuman" className="text-sm font-semibold text-hijau underline underline-offset-4">Semua</Link>
          </div>
          {terbaru.length === 0 ? (
            <p className="text-sm text-muted-fg">Belum ada pengumuman.</p>
          ) : (
            <ul className="divide-y divide-line">
              {terbaru.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/pengumuman/${p.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className={`block truncate text-sm text-hijau-tua ${p.dibaca.length === 0 ? "font-semibold" : ""}`}>{p.judul}</span>
                      <span className="text-xs text-muted-fg">{LABEL_KATEGORI_PENGUMUMAN[p.kategori]}{p.terbitPada && ` · ${formatWaktu(p.terbitPada)}`}</span>
                    </span>
                    {p.dibaca.length === 0 && <span className="shrink-0 rounded-full bg-jingga px-2 py-0.5 text-[11px] font-bold text-hijau-tua">Baru</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="judul-kegiatan" className={KARTU}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="judul-kegiatan" className="text-lg font-bold text-hijau">Kegiatan terdekat</h2>
            <Link href="/admin/kegiatan" className="text-sm font-semibold text-hijau underline underline-offset-4">Semua</Link>
          </div>
          {kegiatan.length === 0 ? (
            <p className="text-sm text-muted-fg">Belum ada kegiatan terjadwal.</p>
          ) : (
            <ul className="divide-y divide-line">
              {kegiatan.map((k) => (
                <li key={k.id}>
                  <Link href={`/admin/kegiatan/${k.id}`} className="block min-h-12 py-2">
                    <span className="block truncate text-sm font-semibold text-hijau-tua">{k.judul}</span>
                    <span className="text-xs text-muted-fg">{formatWaktu(k.mulai)} · {k.lokasi}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {(menunggu !== null || kas) && (
        <section aria-labelledby="judul-keuangan" className="mb-8">
          <h2 id="judul-keuangan" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            Keuangan
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {menunggu !== null && (
              <li>
                <Link
                  href="/admin/pembayaran"
                  className={`${KARTU} block h-full transition-colors hover:border-jingga/60 ${menunggu > 0 ? "border-jingga/60 bg-jingga/10" : ""}`}
                >
                  <p className="text-sm text-muted-fg">Menunggu verifikasi</p>
                  <p className="mt-1 text-3xl font-bold text-hijau">{menunggu}</p>
                  <p className="mt-0.5 text-sm text-muted-fg">
                    {menunggu > 0 ? "pembayaran transfer perlu diperiksa" : "tidak ada yang menunggu"}
                  </p>
                </Link>
              </li>
            )}
            {kas && (
              <li>
                <Link href="/admin/kas" className={`${KARTU} block h-full transition-colors hover:border-jingga/60`}>
                  <p className="text-sm text-muted-fg">Saldo kas</p>
                  <p className="mt-1 text-3xl font-bold text-hijau">{formatRupiah(kas.saldo)}</p>
                  <p className="mt-0.5 text-sm text-muted-fg">
                    Masuk bulan ini {formatRupiah(kas.masukBulan)} · keluar {formatRupiah(kas.keluarBulan)}
                  </p>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}

      {tagihan && (
        <section aria-labelledby="judul-tagihan" className="mb-8">
          <h2 id="judul-tagihan" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            Tagihan
          </h2>
          <ul className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Belum dibayar", ...tagihan.belumLunas, merah: false },
              { label: "Terlambat", ...tagihan.terlambat, merah: true },
              { label: "Lunas", ...tagihan.lunas, merah: false },
            ].map((k) => (
              <li key={k.label}>
                <Link href="/admin/tagihan" className={`${KARTU} block h-full transition-colors hover:border-jingga/60`}>
                  <p className="text-sm text-muted-fg">{k.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${k.merah && k.jumlah > 0 ? "text-red-700" : "text-hijau"}`}>{formatRupiah(k.total)}</p>
                  <p className="mt-0.5 text-sm text-muted-fg">{k.jumlah} tagihan</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tagihanSaya && (
        <section aria-labelledby="judul-tagihan-saya" className={`${KARTU} mb-8`}>
          <h2 id="judul-tagihan-saya" className="text-lg font-bold text-hijau">Tagihan rumah Anda</h2>
          <p className="mt-2 text-3xl font-bold text-hijau">
            {formatRupiah(tagihanSayaBelum.reduce((n, t) => n + t.nominal.toNumber(), 0))}
          </p>
          <p className="mt-1 text-sm text-muted-fg">{tagihanSayaBelum.length} tagihan belum dibayar</p>
          <Link href="/admin/tagihan-saya" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau underline underline-offset-4">
            Lihat tagihan
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {saya && (
        <section aria-labelledby="judul-rumah-saya" className={`${KARTU} mb-8`}>
          <h2 id="judul-rumah-saya" className="text-lg font-bold text-hijau">
            Rumah {kodeRumah(saya.keluarga.rumah)}
          </h2>
          <p className="mt-1 text-sm text-muted-fg">
            {saya.keluarga.anggota.length} anggota keluarga aktif.
          </p>
          <Link href="/admin/profil" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau underline underline-offset-4">
            Lihat profil dan rumah
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      )}

      {punya(peran, "residents.read.own") && !saya && (
        <section className={`${KARTU} mb-8`}>
          <h2 className="text-lg font-bold text-hijau">Akun belum terhubung</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-fg">
            Akun Anda belum dihubungkan ke data warga. Hubungi pengurus RT.
          </p>
        </section>
      )}

      {pengguna.length > 0 && (
        <section aria-labelledby="judul-pengguna" className="mb-8">
          <h2 id="judul-pengguna" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-fg">
            Akun pengguna
          </h2>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className={KARTU}>
              <dt className="text-xs text-muted-fg">Total</dt>
              <dd className="mt-1 text-2xl font-bold text-hijau">{pengguna.reduce((n, k) => n + k._count._all, 0)}</dd>
            </div>
            {PERAN.map((r) => (
              <div key={r} className={KARTU}>
                <dt className="text-xs text-muted-fg">{INFO_PERAN[r].nama}</dt>
                <dd className="mt-1 text-2xl font-bold text-hijau">
                  {pengguna.find((k) => k.role === r)?._count._all ?? 0}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="judul-status" className={KARTU}>
        <h2 id="judul-status" className="text-base font-semibold text-hijau">
          Modul berikutnya
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-fg">
          Payment gateway (bayar online) dikerjakan pada tahap berikutnya.
        </p>
      </section>
    </div>
  );
}
