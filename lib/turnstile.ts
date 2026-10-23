/**
 * Verifikasi token Cloudflare Turnstile.
 *
 * Dipanggil dari route kontak. Token hanya sekali pakai: sekali diverifikasi,
 * token yang sama ditolak pada percobaan berikutnya.
 */
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Harus sama dengan data-action pada widget di formulirnya. */
export const AKSI_KONTAK = "kontak";

/**
 * Aksi untuk widget di formulir masuk CMS.
 *
 * Sengaja berbeda dari AKSI_KONTAK. Site key yang sama dipakai kedua formulir,
 * jadi tanpa pembeda ini token yang dipanen dari formulir kontak publik bisa
 * diputar ulang ke endpoint login.
 */
export const AKSI_MASUK = "masuk";

export type HasilTurnstile =
  | { ok: true }
  | { ok: false; sebab: string; kode?: string[] };

/** Apakah verifikasi diaktifkan. Tanpa rahasia, tidak ada yang bisa diperiksa. */
export const turnstileAktif = () => Boolean(process.env.TURNSTILE_SECRET);

/**
 * Kunci situs Turnstile, dibaca di server lalu dioper ke formulir sebagai prop.
 *
 * Namanya sengaja TANPA awalan NEXT_PUBLIC_. Next membekukan setiap
 * NEXT_PUBLIC_* menjadi nilai literal saat build — di bundel peramban maupun
 * di bundel SSR. Kunci yang belum ada di mesin pembangun image akan selamanya
 * kosong di peramban betapapun benar isi env di Kubernetes: widget-nya hilang
 * saat hidrasi, formulir mengirim tanpa token, dan setiap kiriman dijawab 403.
 * Tanpa awalan itu nilainya dibaca ulang tiap permintaan, jadi satu image bisa
 * dipakai lintas lingkungan dan ganti kunci cukup restart pod.
 */
export function siteKeyTurnstile(): string | null {
  const kunci = process.env.TURNSTILE_SITE_KEY?.trim();

  // Kombinasi paling berbahaya, dan yang paling sulit dilihat: server memeriksa
  // token, tetapi formulirnya tidak pernah bisa membuat satu pun. Semua kiriman
  // ditolak, dan pengirim hanya melihat "verifikasi keamanan gagal".
  if (!kunci && turnstileAktif()) {
    console.error(
      "[turnstile] TURNSTILE_SECRET terisi tetapi TURNSTILE_SITE_KEY kosong. " +
        "Widget tidak akan muncul dan SETIAP kiriman formulir akan ditolak 403.",
    );
  }

  return kunci || null;
}

/**
 * Apakah Turnstile siap dipakai untuk menjaga endpoint login.
 *
 * Menuntut kedua kunci sekaligus, dan itu bukan kehati-hatian berlebih.
 * Secret terisi tetapi site key kosong berarti widget tidak pernah muncul,
 * token tidak pernah terbit, dan SETIAP percobaan masuk ditolak — satu salah
 * ketik env mengunci seluruh admin dari CMS-nya sendiri. Karena itu login
 * memilih lapisan captcha yang mati ketimbang pintu yang terkunci.
 */
export function turnstileSiap(): boolean {
  return Boolean(siteKeyTurnstile()) && turnstileAktif();
}

/**
 * Daftar hostname yang boleh menampilkan widget ini.
 *
 * Tanpa pemeriksaan ini, siapa pun bisa memasang site key kita di situsnya
 * sendiri, memanen token yang sah dari sana, lalu mengirimkannya ke route ini.
 * Site key memang publik — hostname yang membedakan token milik kita.
 */
export function hostnameTurnstile(): string[] {
  return (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((h) =>
      h
        .trim()
        .toLowerCase()
        // Cloudflare menjawab dengan hostname telanjang, jadi yang dibandingkan
        // juga harus telanjang. Skema, port, dan jalur dibuang di sini alih-alih
        // dituntut ditulis benar: salah tulis satu karakter membuat SETIAP
        // kiriman ditolak, dan sebabnya tidak terlihat di layar mana pun.
        .replace(/^[a-z]+:\/\//, "")
        .replace(/[/:].*$/, ""),
    )
    .filter(Boolean);
}

export async function verifikasiTurnstile(
  token: unknown,
  ip: string,
): Promise<HasilTurnstile> {
  const rahasia = process.env.TURNSTILE_SECRET;
  if (!rahasia) return { ok: true };

  if (typeof token !== "string" || !token) {
    return { ok: false, sebab: "Token tidak disertakan." };
  }

  const isi = new URLSearchParams({ secret: rahasia, response: token });
  // Alamat tak dikenal tidak dikirim: Cloudflare menolak nilai yang bukan IP,
  // dan permintaan yang gagal karenanya terbaca seolah tokennya yang salah.
  if (ip && ip !== "tidak-diketahui") isi.set("remoteip", ip);

  let data: {
    success?: boolean;
    action?: string;
    hostname?: string;
    "error-codes"?: string[];
  };
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: isi,
      // Tanpa batas waktu, satu gangguan di sisi Cloudflare menahan permintaan
      // sampai proxy yang memutusnya, dan pengirim hanya melihat halaman diam.
      signal: AbortSignal.timeout(8000),
    });
    data = await res.json();
  } catch (e) {
    console.error("[turnstile] gagal menghubungi siteverify:", e);
    return { ok: false, sebab: "Verifikasi tidak dapat dijalankan." };
  }

  if (!data.success) {
    return {
      ok: false,
      sebab: "Verifikasi tidak lolos.",
      kode: data["error-codes"],
    };
  }

  // Aksi mengikat token pada formulir tertentu. Tanpanya, token dari widget
  // mana pun di domain kita bisa dipakai untuk mengirim ke route ini.
  if (data.action !== AKSI_KONTAK) {
    return { ok: false, sebab: `Aksi tidak sesuai: ${data.action}` };
  }

  const daftar = hostnameTurnstile();
  if (daftar.length === 0) {
    console.error(
      "[turnstile] TURNSTILE_HOSTNAMES kosong. Token dari situs mana pun yang " +
        "memakai site key ini akan diterima. Isi daftar hostname-nya.",
    );
  } else if (!daftar.includes((data.hostname ?? "").toLowerCase())) {
    return { ok: false, sebab: `Hostname tidak diizinkan: ${data.hostname}` };
  }

  return { ok: true };
}
