import type { Metadata } from "next";
import { db } from "@/lib/db";
import { wajibIzin } from "@/lib/cms/sesi";

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
      <h1 className="text-2xl font-semibold text-white">Audit log</h1>
      <p className="mt-1 mb-6 text-sm text-muted-fg">
        Jejak tindakan penting. Hanya bisa dibaca; tidak ada yang dapat diubah
        atau dihapus dari sini.
      </p>

      {baris.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-6 text-sm text-muted-fg">
          Belum ada aktivitas tercatat.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-wider text-muted-fg">
              <tr>
                <th scope="col" className="px-4 py-3">Waktu</th>
                <th scope="col" className="px-4 py-3">Pelaku</th>
                <th scope="col" className="px-4 py-3">Tindakan</th>
                <th scope="col" className="px-4 py-3">Hasil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {baris.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-fg">
                    {b.dibuatPada.toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 text-white">{b.aktorNama}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white">
                    {b.aksi}
                  </td>
                  <td
                    className={
                      b.hasil === "berhasil"
                        ? "px-4 py-3 text-teal-300"
                        : "px-4 py-3 text-red-300"
                    }
                  >
                    {b.hasil}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
