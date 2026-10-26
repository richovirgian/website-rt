"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function TombolKeluar({ ikon = false }: { ikon?: boolean }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);

  return (
    <button
      type="button"
      disabled={proses}
      onClick={async () => {
        setProses(true);
        await authClient.signOut();
        // refresh() supaya layout server melihat cookie sesi sudah hilang.
        router.refresh();
        router.push("/masuk");
      }}
      aria-label="Keluar"
      className={ikon ? "grid size-[30px] shrink-0 place-items-center rounded-[7px] text-[var(--side-muted)] transition-colors hover:bg-white/10 hover:text-[var(--side-strong)] focus-visible:outline-2 focus-visible:outline-[var(--side-accent)] disabled:opacity-50" : "lg:mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-fg transition-colors hover:bg-hijau/[0.06] hover:text-hijau-tua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"}
    >
      <LogOut className="size-4" />
      {!ikon && (proses ? "Keluar..." : "Keluar")}
    </button>
  );
}
