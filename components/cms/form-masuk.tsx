"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Turnstile, type TurnstileRef } from "@/components/site/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Harus sama dengan AKSI_MASUK di lib/turnstile.ts. Ditulis ulang di sini,
 *  bukan diimpor: modul itu berisi kode server, dan komponen ini berjalan di
 *  peramban — pola yang sama dipakai components/site/contact-form.tsx. */
const AKSI = "masuk";

const ISIAN =
  "h-12 rounded-lg border-hijau/25 bg-white px-3.5 text-base text-hijau-tua placeholder:text-hijau-tua/40 focus-visible:border-hijau focus-visible:ring-hijau/30 md:text-base";

/**
 * Tiga batang yang naik-turun bergiliran selama menunggu token Turnstile.
 *
 * Geraknya ada di app/globals.css (.batang-verifikasi), bukan di sini, supaya
 * ikut aturan prefers-reduced-motion yang berlaku untuk seluruh situs.
 *
 * Tanpa penanda apa pun, tombol yang mati selama beberapa detik terbaca
 * seperti halaman rusak. Ukurannya tidak ditulis: varian Button sudah
 * menyetel setiap svg anaknya ke size-4, dan warnanya ikut teks tombol.
 */
function BatangVerifikasi() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="batang-verifikasi"
    >
      <rect x="2" y="4" width="3" height="8" rx="1.5" />
      <rect x="6.5" y="4" width="3" height="8" rx="1.5" />
      <rect x="11" y="4" width="3" height="8" rx="1.5" />
    </svg>
  );
}

export function FormMasuk({
  siteKey,
}: {
  /** Kunci situs Turnstile, dibaca server dari env runtime. Sengaja TIDAK
   *  dibaca dari process.env di sini: NEXT_PUBLIC_* membeku saat build, dan
   *  kunci yang belum ada di mesin pembangun image akan selamanya kosong di
   *  peramban. `null` berarti lapisan captcha mati — keadaan normal saat
   *  pengembangan lokal, dan formulirnya tetap bisa dipakai masuk. */
  siteKey: string | null;
}) {
  const router = useRouter();
  const [kirim, setKirim] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [lihat, setLihat] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);

  // Satu sumber kebenaran untuk keadaan "menunggu token": dipakai oleh
  // disabled, kelas tombol, ikon, dan label sekaligus. Ditulis ulang di tiap
  // tempat, keempatnya bisa menyimpang sendiri-sendiri tanpa ketahuan.
  const menunggu = Boolean(siteKey) && !token && !kirim;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGalat(null);
    setKirim(true);

    const data = new FormData(e.currentTarget);

    // Dibaca dari header jawaban, bukan dari badan: pembatas laju Better Auth
    // menaruh sisa waktunya di X-Retry-After, dan tanpa itu pesannya hanya
    // bisa berkata "coba lagi nanti" tanpa pernah menyebut kapan.
    //
    // Disimpan sebagai properti objek, bukan `let`. TypeScript tidak melacak
    // penugasan yang terjadi di dalam callback: variabel biasa akan menyempit
    // jadi `never` di titik pembacaan, dan kodenya berhenti bisa dikompilasi.
    const jeda = { detik: null as number | null };

    const { error } = await authClient.signIn.email({
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("sandi") ?? ""),
      fetchOptions: {
        headers: token ? { "x-captcha-response": token } : undefined,
        onError: (ctx) => {
          const detik = Number(ctx.response.headers.get("X-Retry-After"));
          jeda.detik = Number.isFinite(detik) && detik > 0 ? detik : null;
        },
      },
    });

    if (error) {
      const kode = (error as { code?: string }).code;

      if (error.status === 429) {
        const menit = jeda.detik ? Math.max(1, Math.ceil(jeda.detik / 60)) : 10;
        setGalat(
          `Terlalu banyak percobaan masuk. Coba lagi dalam ${menit} menit.`,
        );
      } else if (kode === "VERIFICATION_FAILED" || kode === "MISSING_RESPONSE") {
        setGalat("Verifikasi keamanan gagal. Muat ulang halaman, lalu coba lagi.");
      } else if (kode === "UNKNOWN_ERROR") {
        setGalat(
          "Verifikasi keamanan sedang tidak bisa dijalankan. Coba lagi sebentar lagi.",
        );
      } else {
        // Pesannya sengaja tidak membedakan "email tidak ada" dari "sandi salah".
        // Membedakannya memberi tahu penebak bahwa sebuah email terdaftar.
        setGalat("Email atau sandi tidak cocok.");
      }

      // Token Turnstile sekali pakai: tanpa reset, percobaan berikutnya
      // mengirim token mati dan ditolak dengan sebab yang salah.
      turnstileRef.current?.reset();
      setKirim(false);
      return;
    }

    // refresh() dulu supaya layout server membaca cookie sesi yang baru,
    // baru berpindah. Tanpa itu /admin bisa dirender dengan sesi lama.
    router.refresh();
    router.push("/admin");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {galat && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-600/30 bg-red-50 px-3.5 py-3 text-sm text-red-800"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {galat}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-base font-medium text-hijau-tua">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={ISIAN}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sandi" className="text-base font-medium text-hijau-tua">
          Password
        </Label>
        <div className="relative">
          <Input
            id="sandi"
            name="sandi"
            type={lihat ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${ISIAN} pr-12`}
          />
          {/* Label tombolnya menyebut tindakan berikutnya, bukan keadaan
              sekarang: "Sembunyikan password" saat sedang terlihat. Menyebut
              keadaan membuat pembaca layar tidak tahu apa yang akan terjadi
              kalau tombolnya ditekan. */}
          <button
            type="button"
            onClick={() => setLihat((v) => !v)}
            aria-pressed={lihat}
            aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-lg text-hijau-tua/60 transition-colors hover:text-hijau focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hijau"
          >
            {lihat ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {siteKey && (
        <Turnstile
          siteKey={siteKey}
          action={AKSI}
          onToken={setToken}
          kendali={turnstileRef}
        />
      )}

      {/* Tombol dikunci selama token belum terbit. Tanpa itu formulir bisa
          mengirim permintaan yang sudah pasti dijawab 400, dan yang dibaca
          admin adalah "verifikasi keamanan gagal" untuk sesuatu yang hanya
          belum selesai memuat. */}
      <Button
        type="submit"
        disabled={kirim || menunggu}
        className={cn(
          "mt-2 h-12 rounded-lg bg-hijau text-base font-semibold text-krem hover:bg-hijau-tua",
          // Redup 50% bawaan varian berkata "tidak tersedia", padahal tombol
          // ini sedang bekerja. Tetap tidak bisa diklik, hanya tidak lagi
          // terbaca seperti mati. cn() membuang disabled:opacity-50 bawaannya,
          // jadi tidak ada perang spesifisitas.
          //
          // Labelnya juga diturunkan ke text-sm. Pada 16px, kalimat sepanjang
          // ini menyisakan NOL piksel di layar 360px, dan varian tombol ini
          // whitespace-nowrap: yang tidak muat meluber keluar, bukan turun
          // baris. "Masuk" tetap 16px — aksi utama tetap tegas, sedangkan
          // teks status memang semestinya terbaca sekunder.
          menunggu && "text-sm disabled:opacity-100",
        )}
      >
        {kirim && <Loader2 className="size-4 animate-spin" />}
        {menunggu && <BatangVerifikasi />}
        {kirim
          ? "Memeriksa..."
          : menunggu
            ? "Memeriksa keamanan..."
            : "Masuk"}
      </Button>
    </form>
  );
}
