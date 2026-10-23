import type { Metadata } from "next";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";
import { DaftarResponsif } from "@/components/cms/daftar-responsif";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Audit log" };

const PER_HALAMAN = 50;

export default async function HalamanAudit({
  searchParams,
}: {
  searchParams: Promise<{ halaman?: string }>;
}) {
  await wajibIzin("audit.read");

  const { halaman } = await searchParams;
  const nomor = Math.max(1, Number.parseInt(halaman ?? "1", 10) || 1);

  const [baris, total] = await Promise.all([
    db().auditLog.findMany({
      orderBy: { dibuatPada: "desc" },
      skip: (nomor - 1) * PER_HALAMAN,
      take: PER_HALAMAN,
    }),
    db().auditLog.count(),
  ]);
  const jumlahHalaman = Math.max(1, Math.ceil(total / PER_HALAMAN));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-hijau-tua">Audit log</h1>
      <p className="mt-1 mb-6 text-sm text-muted-fg">
        Jejak tindakan penting. Hanya bisa dibaca; tidak ada yang dapat diubah
        atau dihapus dari sini.
      </p>

      {baris.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted-fg">
          Belum ada aktivitas tercatat.
        </p>
      ) : (
        <DaftarResponsif
          label="Audit log"
          baris={baris}
          kunci={(b) => b.id}
          kolom={[
            {
              judul: "Tindakan",
              utama: true,
              sel: (b) => <span className="font-mono text-xs">{b.aksi}</span>,
            },
            {
              judul: "Waktu",
              sel: (b) => (
                <span className="whitespace-nowrap">
                  {b.dibuatPada.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}
                </span>
              ),
            },
            { judul: "Pelaku", sel: (b) => b.aktorNama },
            {
              judul: "Hasil",
              sel: (b) => <span className={b.hasil === "berhasil" ? "text-hijau" : "text-red-700"}>{b.hasil}</span>,
            },
          ]}
        />
      )}

      {jumlahHalaman > 1 && (
        <nav aria-label="Halaman" className="mt-4 flex items-center gap-3 text-sm">
          {nomor > 1 && (
            <a className="text-brand hover:underline" href={`?halaman=${nomor - 1}`}>
              Sebelumnya
            </a>
          )}
          <span className="text-muted-fg">
            Halaman {nomor} dari {jumlahHalaman}
          </span>
          {nomor < jumlahHalaman && (
            <a className="text-brand hover:underline" href={`?halaman=${nomor + 1}`}>
              Berikutnya
            </a>
          )}
        </nav>
      )}
    </div>
  );
}
