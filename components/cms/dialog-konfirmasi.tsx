"use client";

import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * Dialog konfirmasi untuk tindakan yang tidak ingin dilakukan tanpa sengaja.
 *
 * Memakai <dialog> bawaan dengan showModal(), bukan div bertumpuk sendiri.
 * Yang bawaan sudah membawa jebakan fokus, tutup dengan Esc, latar inert, dan
 * pengembalian fokus ke pemicunya. Membangunnya ulang berarti membangun ulang
 * semua itu, dan yang paling sering tertinggal justru jebakan fokusnya —
 * pengguna papan ketik bisa berpindah ke halaman di belakang dialog yang
 * seharusnya terkunci.
 */
export function DialogKonfirmasi({
  terbuka,
  judul,
  keterangan,
  labelYa,
  onYa,
  onBatal,
  sedangProses = false,
}: {
  terbuka: boolean;
  judul: string;
  keterangan: string;
  labelYa: string;
  onYa: () => void;
  onBatal: () => void;
  sedangProses?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (terbuka && !d.open) d.showModal();
    if (!terbuka && d.open) d.close();
  }, [terbuka]);

  return (
    <dialog
      ref={ref}
      // Esc dan klik di latar ditangani peramban; keduanya memicu "cancel".
      onCancel={(e) => {
        e.preventDefault();
        if (!sedangProses) onBatal();
      }}
      onClick={(e) => {
        // Klik tepat di elemen dialog berarti mengenai latarnya, bukan isinya.
        if (e.target === ref.current && !sedangProses) onBatal();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2.5rem))] rounded-2xl border border-line-strong bg-surface p-0 text-white backdrop:bg-background/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-red-500/15 text-red-300">
            <TriangleAlert className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{judul}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-fg">
              {keterangan}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onBatal}
            disabled={sedangProses}
            className="h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-muted-fg transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onYa}
            disabled={sedangProses}
            // autoFocus tidak dipasang di tombol merusak: dialog yang membuka
            // dengan fokus di "Hapus" bisa terpicu oleh Enter yang masih
            // tertekan dari interaksi sebelumnya.
            className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
          >
            {sedangProses ? "Memproses..." : labelYa}
          </button>
        </div>
      </div>
    </dialog>
  );
}
