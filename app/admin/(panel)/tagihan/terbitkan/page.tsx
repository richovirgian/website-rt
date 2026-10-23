import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { wajibIzin } from "@/lib/cms/sesi";
import { jenisIuranAktif } from "@/lib/iuran-kueri";
import { nominalBerlaku, rumahBerpenghuni } from "@/lib/tagihan";
import { kodeRumah } from "@/lib/warga-label";
import { formatRupiah, hariIni, periodeSekarang } from "@/lib/uang";
import { JudulHalaman } from "@/components/cms/judul-halaman";
import { FormTerbitkan } from "@/components/cms/form-terbitkan";
import { KARTU } from "@/components/cms/gaya";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Terbitkan tagihan" };

export default async function HalamanTerbitkan() {
  await wajibIzin("bills.create");
  const [jenis, rumah] = await Promise.all([jenisIuranAktif(), rumahBerpenghuni()]);

  const hari = hariIni();
  const jenisDenganNominal = await Promise.all(
    jenis.map(async (j) => {
      const n = await nominalBerlaku(j.id, hari);
      return { ...j, nominalSekarang: n === null ? null : formatRupiah(n) };
    }),
  );

  return (
    <div className="max-w-3xl">
      <Link href="/admin/tagihan" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-hijau hover:underline">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Semua tagihan
      </Link>
      <JudulHalaman
        judul="Terbitkan tagihan"
        keterangan="Tagihan ke seluruh rumah berpenghuni, atau ke rumah tertentu. Rumah yang sudah punya tagihan untuk periode yang sama dilewati, tidak pernah digandakan."
      />
      <div className={KARTU}>
        <FormTerbitkan
          jenis={jenisDenganNominal}
          rumah={rumah.map((r) => ({ id: r.id, kode: kodeRumah(r) }))}
          periodeAwal={periodeSekarang()}
        />
      </div>
    </div>
  );
}
