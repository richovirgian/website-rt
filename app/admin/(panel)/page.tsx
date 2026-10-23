import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Home, UserCheck, UserRound, Users } from "lucide-react";
import { db } from "@/lib/db";
import { wajibMasuk, peranPengguna } from "@/lib/cms/sesi";
import { INFO_PERAN, PERAN, punya } from "@/lib/izin";
import { profilWargaSendiri, ringkasanWarga } from "@/lib/warga";
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
          Iuran, tagihan, pembayaran, dan kas dikerjakan pada tahap berikutnya.
          Ringkasannya akan muncul di sini setelah modulnya ada.
        </p>
      </section>
    </div>
  );
}
