import { NextResponse } from "next/server";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { wargaUntukEkspor } from "@/lib/warga";
import { tulisCsv } from "@/lib/csv";
import { LABEL_DOMISILI, LABEL_HUBUNGAN, LABEL_HUNIAN, LABEL_JK } from "@/lib/warga-label";

/**
 * Ekspor data warga ke CSV. Perlu izin `residents.export`. NIK TIDAK pernah
 * diekspor. Setiap ekspor tercatat di audit log.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const cek = await periksaIzinAksi("residents.export");
  if (!cek.ok) {
    return NextResponse.json({ pesan: cek.pesan }, { status: 403 });
  }

  const warga = await wargaUntukEkspor();
  const csv = tulisCsv([
    ["blok", "nomor_rumah", "nama", "jenis_kelamin", "hubungan", "status_hunian", "status_domisili", "tempat_lahir", "tanggal_lahir", "no_hp", "pekerjaan"],
    ...warga.map((w) => [
      w.keluarga.rumah.blok,
      w.keluarga.rumah.nomor,
      w.namaLengkap,
      w.jenisKelamin ? LABEL_JK[w.jenisKelamin] : "",
      LABEL_HUBUNGAN[w.hubungan],
      LABEL_HUNIAN[w.keluarga.statusHunian],
      LABEL_DOMISILI[w.statusDomisili],
      w.tempatLahir,
      w.tanggalLahir?.toISOString().slice(0, 10),
      w.noHp,
      w.pekerjaan,
    ]),
  ]);

  await catatAudit({
    aktorId: cek.sesi.user.id,
    aktorNama: cek.sesi.user.name,
    aksi: "warga.ekspor",
    entitas: "warga",
    metadata: { jumlah: warga.length },
  });

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="warga-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
