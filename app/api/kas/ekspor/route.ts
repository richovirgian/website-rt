import { NextResponse } from "next/server";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { bulanSah, kasUntukEkspor } from "@/lib/pembayaran-kueri";
import { tulisCsv } from "@/lib/csv";
import { isoDari } from "@/lib/uang";

/**
 * Ekspor buku kas ke CSV. Perlu `reports.export`. Boleh dibatasi satu bulan
 * lewat ?bulan=YYYY-MM. Setiap ekspor tercatat di audit log.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cek = await periksaIzinAksi("reports.export");
  if (!cek.ok) return NextResponse.json({ pesan: cek.pesan }, { status: 403 });

  const bulanParam = new URL(req.url).searchParams.get("bulan") ?? undefined;
  const bulan = bulanSah(bulanParam) ? bulanParam : undefined;
  const baris = await kasUntukEkspor(bulan);

  const csv = tulisCsv([
    ["nomor", "tanggal", "jenis", "kategori", "nominal", "deskripsi", "dicatat_oleh"],
    ...baris.map((t) => [
      t.nomor,
      isoDari(t.tanggal),
      t.jenis === "MASUK" ? "Masuk" : "Keluar",
      t.kategori.nama,
      t.nominal.toNumber(),
      t.deskripsi,
      t.dicatatOleh,
    ]),
  ]);

  await catatAudit({
    aktorId: cek.sesi.user.id,
    aktorNama: cek.sesi.user.name,
    aksi: "kas.ekspor",
    entitas: "transaksi_kas",
    metadata: { bulan: bulan ?? "semua", jumlah: baris.length },
  });

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="kas-${bulan ?? "semua"}.csv"`,
      "cache-control": "no-store",
    },
  });
}
