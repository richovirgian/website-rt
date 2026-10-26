import Link from "next/link";
import { Bell } from "lucide-react";

/** Lonceng di kepala panel dengan jumlah notifikasi yang belum dibaca. */
export function LoncengNotifikasi({ jumlah, gelap = false }: { jumlah: number; gelap?: boolean }) {
  return (
    <Link
      href="/admin/notifikasi"
      aria-label={jumlah > 0 ? `Notifikasi, ${jumlah} belum dibaca` : "Notifikasi"}
      className={`relative grid size-11 place-items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 print:hidden ${gelap ? "text-[var(--side-text)] hover:bg-white/10 focus-visible:outline-[var(--side-accent)]" : "text-hijau hover:bg-krem-2 focus-visible:outline-hijau"}`}
    >
      <Bell className="size-5" aria-hidden="true" />
      {jumlah > 0 && (
        <span aria-hidden="true" className="absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-jingga px-1 text-[11px] font-bold leading-5 text-hijau-tua">
          {jumlah > 99 ? "99+" : jumlah}
        </span>
      )}
    </Link>
  );
}
