"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function TombolKeluar() {
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
      className="lg:mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-fg transition-colors hover:bg-hijau/[0.06] hover:text-hijau-tua focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50"
    >
      <LogOut className="size-4" />
      {proses ? "Keluar..." : "Keluar"}
    </button>
  );
}
