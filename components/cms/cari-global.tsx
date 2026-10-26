"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Home as IkonHome, House, Search, UserRound, X } from "lucide-react";
import { cariCepat, type HasilCari } from "@/lib/cms/aksi-cari";
import { IKON_MENU } from "@/components/cms/ikon-menu";
import { cn } from "@/lib/utils";

type Butir = { href: string; label: string; ikon: string };
type Hasil = { kunci: string; href: string; judul: string; ket?: string; ikon: React.ReactNode; bagian: string };

/**
 * Kotak "Cari apa saja" (Cmd/Ctrl+K). Mencari halaman menu di peramban, dan
 * data warga serta rumah lewat aksi server (hanya untuk peran yang berizin).
 * `ikon` = tombol bulat kecil untuk kepala ponsel.
 */
export function CariGlobal({ menu, varian = "sidebar" }: { menu: readonly Butir[]; varian?: "sidebar" | "ikon" }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [buka, setBuka] = useState(false);
  const [q, setQ] = useState("");
  const [data, setData] = useState<HasilCari>({ warga: [], rumah: [] });
  const [aktif, setAktif] = useState(0);

  const tutup = () => {
    setBuka(false);
    setQ("");
    setData({ warga: [], rumah: [] });
    setAktif(0);
  };

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  // Pintasan papan ketik hanya dipasang oleh satu instans (menu samping),
  // supaya instans ponsel yang tersembunyi tidak ikut terbuka.
  useEffect(() => {
    if (varian !== "sidebar") return;
    const tekan = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setBuka(true);
      }
    };
    window.addEventListener("keydown", tekan);
    return () => window.removeEventListener("keydown", tekan);
  }, [varian]);

  useEffect(() => {
    if (q.trim().length < 2) return;
    let batal = false;
    const t = setTimeout(() => {
      cariCepat(q).then((h) => {
        if (!batal) {
          setData(h);
          setAktif(0);
        }
      });
    }, 220);
    return () => {
      batal = true;
      clearTimeout(t);
    };
  }, [q]);

  const hasil: Hasil[] = useMemo(() => {
    const kata = q.trim().toLowerCase();
    const halaman = menu
      .filter((m) => !kata || m.label.toLowerCase().includes(kata))
      .slice(0, kata ? 6 : 8)
      .map((m): Hasil => {
        const Ikon = IKON_MENU[m.ikon] ?? IkonHome;
        return { kunci: `m:${m.href}:${m.label}`, href: m.href, judul: m.label, ikon: <Ikon className="size-4" aria-hidden="true" />, bagian: "Halaman" };
      });
    if (kata.length < 2) return halaman;
    return [
      ...data.warga.map((w): Hasil => ({ kunci: `w:${w.id}`, href: `/admin/warga/${w.id}`, judul: w.nama, ket: w.keterangan, ikon: <UserRound className="size-4" aria-hidden="true" />, bagian: "Warga" })),
      ...data.rumah.map((r): Hasil => ({ kunci: `r:${r.id}`, href: `/admin/rumah/${r.id}`, judul: `Rumah ${r.kode}`, ket: r.keterangan, ikon: <House className="size-4" aria-hidden="true" />, bagian: "Rumah" })),
      ...halaman,
    ];
  }, [q, menu, data]);

  const pergi = (h: Hasil) => {
    tutup();
    router.push(h.href);
  };

  const sudahDicari = q.trim().length >= 2;
  const bagianAda = [...new Set(hasil.map((h) => h.bagian))];

  return (
    <>
      {varian === "sidebar" ? (
        <button
          type="button"
          onClick={() => setBuka(true)}
          aria-haspopup="dialog"
          className="flex h-11 w-full shrink-0 items-center gap-2.5 rounded-[10px] border border-[var(--side-border)] bg-[var(--side-surface)] px-3 text-left text-[15px] text-[var(--side-muted)] transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-[var(--side-accent)]"
        >
          <Search className="size-[18px] shrink-0" aria-hidden="true" />
          <span className="flex-1">Cari apa saja…</span>
          <kbd className="font-mono-geist rounded-[5px] border border-[var(--side-border)] px-1.5 text-xs">⌘K</kbd>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setBuka(true)}
          aria-haspopup="dialog"
          aria-label="Cari apa saja"
          className="grid size-11 place-items-center rounded-full text-[var(--side-text)] transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--side-accent)]"
        >
          <Search className="size-5" aria-hidden="true" />
        </button>
      )}

      <dialog
        ref={dialog}
        onClose={tutup}
        onClick={(e) => e.target === dialog.current && tutup()}
        aria-label="Cari apa saja"
        className="m-0 w-full max-w-none bg-transparent p-0 backdrop:bg-[#1c2740]/50 sm:mx-auto sm:mt-[12vh] sm:max-w-xl"
      >
        <div className="panel flex max-h-[100dvh] flex-col overflow-hidden bg-surface text-hijau-tua sm:max-h-[70dvh] sm:rounded-2xl sm:border sm:border-line-strong sm:shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3.5">
            <Search className="size-4 shrink-0 text-muted-fg" aria-hidden="true" />
            <input
              autoFocus
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-controls="hasil-cari"
              aria-label="Cari halaman, warga, atau rumah"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  // Di kolom type=search, Esc pertama hanya mengosongkan teks; di sini langsung menutup.
                  e.preventDefault();
                  tutup();
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setAktif((a) => Math.min(a + 1, hasil.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setAktif((a) => Math.max(a - 1, 0));
                } else if (e.key === "Enter" && hasil[aktif]) {
                  e.preventDefault();
                  pergi(hasil[aktif]!);
                }
              }}
              placeholder="Cari halaman, warga, atau rumah…"
              className="h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#8a8580] [&::-webkit-search-cancel-button]:hidden"
            />
            <button type="button" onClick={tutup} aria-label="Tutup pencarian" className="grid size-11 place-items-center rounded-full hover:bg-krem-2 sm:size-9">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div id="hasil-cari" role="listbox" aria-label="Hasil pencarian" className="min-h-0 flex-1 overflow-y-auto p-2">
            {hasil.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-fg">{sudahDicari ? "Tidak ada yang cocok." : "Ketik untuk mencari."}</p>
            ) : (
              bagianAda.map((b) => (
                <div key={b} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-fg">{b}</p>
                  {hasil.map((h, i) =>
                    h.bagian !== b ? null : (
                      <button
                        key={h.kunci}
                        type="button"
                        role="option"
                        aria-selected={i === aktif}
                        onMouseEnter={() => setAktif(i)}
                        onClick={() => pergi(h)}
                        className={cn("flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm", i === aktif ? "bg-krem-2" : "hover:bg-krem-2/60")}
                      >
                        <span className="text-hijau">{h.ikon}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{h.judul}</span>
                        {h.ket && <span className="shrink-0 text-xs text-muted-fg">{h.ket}</span>}
                      </button>
                    ),
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
