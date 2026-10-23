"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Angka yang berhitung naik saat masuk layar, sekali saja. Tanpa
 * JavaScript atau dengan "kurangi gerakan", angka akhirnya langsung tampil.
 */
export function CountUp({
  nilai,
  akhiran = "",
  durasi = 1400,
}: {
  nilai: number;
  akhiran?: string;
  durasi?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [tampil, setTampil] = useState(nilai);
  // Angka tahun tidak diberi pemisah ribuan ("2009", bukan "2.009").
  const adalahTahun = nilai >= 1900 && nilai <= 2100;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        const mulai = performance.now();
        const langkah = (t: number) => {
          const p = Math.min(1, (t - mulai) / durasi);
          // Melambat di ujung supaya angka akhir terasa "mendarat".
          setTampil(Math.round(nilai * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(langkah);
        };
        setTampil(0);
        raf = requestAnimationFrame(langkah);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [nilai, durasi]);

  return (
    <span ref={ref}>
      {adalahTahun ? tampil : tampil.toLocaleString("id-ID")}
      {akhiran}
    </span>
  );
}
