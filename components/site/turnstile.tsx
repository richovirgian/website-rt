"use client";

import Script from "next/script";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opsi: {
          sitekey: string;
          action?: string;
          theme?: "auto" | "light" | "dark";
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

/**
 * Widget Cloudflare Turnstile.
 *
 * Dirender secara eksplisit lewat window.turnstile.render, bukan lewat kelas
 * cf-turnstile yang dipindai otomatis. Pemindaian otomatis berjalan sekali
 * saat skripnya dimuat; di React, elemen yang sama bisa dipasang ulang setelah
 * itu, dan widget-nya tidak pernah muncul kembali — atau justru tergandakan.
 *
 * Token bersifat sekali pakai. Pemanggil wajib memanggil `reset` setelah tiap
 * kiriman, berhasil maupun gagal, agar percobaan berikutnya punya token baru.
 */
export type TurnstileRef = { reset: () => void };

export function Turnstile({
  siteKey,
  action,
  onToken,
  kendali,
}: {
  siteKey: string;
  action: string;
  onToken: (token: string | null) => void;
  /** Diisi dengan fungsi reset, supaya formulir bisa memanggilnya. */
  kendali?: React.RefObject<TurnstileRef | null>;
}) {
  const wadah = useRef<HTMLDivElement>(null);
  const idWidget = useRef<string | null>(null);
  const [siap, setSiap] = useState(false);
  const uid = useId();

  // Disimpan di ref agar efek pemasangan tidak ikut berjalan ulang setiap
  // induknya merender — memasang ulang widget akan mengosongkan tokennya.
  const kirimTokenRef = useRef(onToken);
  useEffect(() => {
    kirimTokenRef.current = onToken;
  }, [onToken]);

  const pasang = useCallback(() => {
    if (!wadah.current || idWidget.current || !window.turnstile) return;
    idWidget.current = window.turnstile.render(wadah.current, {
      sitekey: siteKey,
      action,
      theme: "light",
      callback: (t) => kirimTokenRef.current(t),
      // Token kedaluwarsa setelah beberapa menit. Halaman yang dibiarkan
      // terbuka lama akan mengirim token mati kalau ini tidak dikosongkan.
      "expired-callback": () => kirimTokenRef.current(null),
      "error-callback": () => kirimTokenRef.current(null),
    });
  }, [siteKey, action]);

  useEffect(() => {
    if (siap) pasang();
    return () => {
      if (idWidget.current && window.turnstile) {
        window.turnstile.remove(idWidget.current);
        idWidget.current = null;
      }
    };
  }, [siap, pasang]);

  useImperativeHandle(
    kendali,
    () => ({
      reset: () => {
        if (idWidget.current && window.turnstile) {
          window.turnstile.reset(idWidget.current);
          kirimTokenRef.current(null);
        }
      },
    }),
    [],
  );

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setSiap(true)}
      />
      <div ref={wadah} id={`turnstile-${uid}`} />
    </>
  );
}
