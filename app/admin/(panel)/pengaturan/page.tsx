import type { Metadata } from "next";
import { wajibIzin } from "@/lib/cms/sesi";
import { pengaturanRt } from "@/lib/pengaturan";
import { FormPengaturan } from "@/components/cms/form-pengaturan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Pengaturan RT" };

export default async function HalamanPengaturan() {
  await wajibIzin("settings.manage");
  const awal = await pengaturanRt();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-hijau-tua">Pengaturan RT</h1>
      <p className="mt-1 mb-8 text-sm text-muted-fg">
        Identitas RT dan rekening tujuan transfer manual.
      </p>
      <FormPengaturan awal={awal} />
    </div>
  );
}
