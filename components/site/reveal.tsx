"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Memunculkan isinya saat masuk layar, sekali saja.
 *
 * Keadaan awal (.reveal) menyembunyikan isi; .reveal-in memulihkannya lewat
 * animasi. Tanpa JavaScript, aturan <noscript>/scripting:none di globals.css
 * menampilkan isinya apa adanya, dan prefers-reduced-motion mematikan geraknya.
 * `delay` (ms) menyusun kemunculan kartu bersebelahan secara berurutan.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "section";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [terlihat, setTerlihat] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setTerlihat(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", terlihat && "reveal-in", className)}
      style={terlihat && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
