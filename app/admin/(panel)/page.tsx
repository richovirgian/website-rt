import type { Metadata } from "next";
import { db } from "@/lib/db";
import { wajibMasuk, peranPengguna } from "@/lib/cms/sesi";
import { INFO_PERAN, PERAN, punya } from "@/lib/izin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ringkasan" };

/**
 * Dasbor Tahap 0. Angka yang tampil dihitung dari database; modul yang belum
 * dibangun dinyatakan apa adanya, bukan diisi angka contoh.
 */
export default async function Ringkasan() {
  const s = await wajibMasuk();
  const peran = peranPengguna(s);

  const kelompok = punya(peran, "users.manage")
    ? await db().user.groupBy({ by: ["role"], _count: { _all: true } })
    : [];
  const hitung = (r: string) =>
    kelompok.find((k) => k.role === r)?._count._all ?? 0;
  const total = kelompok.reduce((n, k) => n + k._count._all, 0);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-white">
        Halo, {s.user.name}
      </h1>
      <p className="mt-1 text-sm text-muted-fg">
        Anda masuk sebagai {INFO_PERAN[peran].nama}.
      </p>

      {punya(peran, "users.manage") && (
        <section aria-labelledby="judul-pengguna" className="mt-8">
          <h2 id="judul-pengguna" className="text-sm font-semibold uppercase tracking-wider text-muted-fg">
            Pengguna terdaftar
          </h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kartu label="Total" nilai={total} />
            {PERAN.map((r) => (
              <Kartu key={r} label={INFO_PERAN[r].nama} nilai={hitung(r)} />
            ))}
          </dl>
        </section>
      )}

      <section
        aria-labelledby="judul-status"
        className="mt-8 rounded-xl border border-line bg-surface p-5"
      >
        <h2 id="judul-status" className="text-base font-semibold text-white">
          Modul belum tersedia
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-fg">
          Data warga, tagihan, pembayaran, dan kas dikerjakan pada tahap
          berikutnya. Ringkasannya akan muncul di sini setelah modulnya ada.
        </p>
      </section>
    </div>
  );
}

function Kartu({ label, nilai }: { label: string; nilai: number }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <dt className="text-xs text-muted-fg">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold text-white">{nilai}</dd>
    </div>
  );
}
