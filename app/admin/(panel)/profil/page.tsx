import type { Metadata } from "next";
import { wajibIzin } from "@/lib/cms/sesi";
import { profilWargaSendiri } from "@/lib/warga";
import { kodeRumah, LABEL_HUBUNGAN, LABEL_HUNIAN } from "@/lib/warga-label";
import { formatTanggal } from "@/lib/profil";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profil dan rumah" };

/**
 * Halaman milik warga. Datanya dicari dari ID akun yang sedang masuk, bukan
 * dari parameter URL, sehingga warga tidak bisa melihat rumah tangga lain.
 */
export default async function HalamanProfil() {
  const s = await wajibIzin("residents.read.own");
  const w = await profilWargaSendiri(s.user.id);

  if (!w) {
    return (
      <div className="max-w-2xl">
        <JudulHalaman judul="Profil dan rumah" />
        <div className={KARTU}>
          <p className="leading-relaxed text-hijau-tua/85">
            Akun Anda belum dihubungkan ke data warga. Hubungi pengurus RT agar
            akun ini ditautkan ke data rumah tangga Anda.
          </p>
        </div>
      </div>
    );
  }

  const k = w.keluarga;
  return (
    <div className="max-w-3xl">
      <JudulHalaman judul="Profil dan rumah" keterangan="Data rumah tangga Anda. Untuk perubahan, hubungi pengurus." />

      <section aria-labelledby="judul-saya" className={`${KARTU} mb-6`}>
        <h2 id="judul-saya" className="text-lg font-bold text-hijau">Data Anda</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            ["Nama", w.namaLengkap],
            ["Hubungan", LABEL_HUBUNGAN[w.hubungan]],
            ["Nomor HP", w.noHp ?? "—"],
            ["Pekerjaan", w.pekerjaan ?? "—"],
          ].map(([a, b]) => (
            <div key={a}>
              <dt className="text-xs font-semibold uppercase tracking-wider text-muted-fg">{a}</dt>
              <dd className="mt-1">{b}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="judul-rumah" className={KARTU}>
        <h2 id="judul-rumah" className="text-lg font-bold text-hijau">
          Rumah {kodeRumah(k.rumah)}
        </h2>
        <p className="mt-1 text-sm text-muted-fg">
          {LABEL_HUNIAN[k.statusHunian]}
          {k.rumah.alamat && ` · ${k.rumah.alamat}`}
          {k.tanggalMasuk && ` · masuk ${formatTanggal(k.tanggalMasuk.toISOString().slice(0, 10))}`}
        </p>
        <h3 className="mt-5 text-sm font-semibold uppercase tracking-wider text-muted-fg">Anggota keluarga</h3>
        <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
          {k.anggota.map((a) => (
            <li key={a.id} className="flex items-center justify-between px-4 py-3">
              <span className="font-medium">{a.namaLengkap}</span>
              <span className="text-sm text-muted-fg">{LABEL_HUBUNGAN[a.hubungan]}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
