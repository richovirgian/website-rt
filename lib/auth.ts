import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { admin, captcha } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { AKSI_MASUK, hostnameTurnstile, turnstileSiap } from "@/lib/turnstile";

const ac = createAccessControl(defaultStatements);

const peranAdmin = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "delete",
    "set-password",
    "update",
    "get",
  ],
  session: ["list", "revoke", "delete"],
});

// Bendahara dan warga tidak mengelola akun lewat plugin admin. Izin bisnis
// mereka ada di lib/izin.ts, bukan di sini: plugin ini hanya menjaga
// endpoint manajemen pengguna bawaan Better Auth.
const bendahara = ac.newRole({});
const warga = ac.newRole({});

/**
 * Autentikasi untuk panel pengelolaan RT.
 *
 * Dibuat saat pertama dipakai, dengan alasan yang sama seperti koneksi
 * database: `next build` mengimpor setiap route, dan di dalam container tidak
 * ada DATABASE_URL. Kalau instance ini dibangun di tingkat modul, build gagal
 * padahal tidak ada satu pun kueri yang dijalankan.
 *
 * PENDAFTARAN MANDIRI DIMATIKAN. Ini panel admin, bukan layanan publik: kalau
 * `signUp` terbuka, siapa pun yang menemukan /admin bisa membuat akun untuk
 * dirinya sendiri. Akun dibuat lewat skrip `npm run cms:akun`.
 */
function buat() {
  const rahasia = process.env.BETTER_AUTH_SECRET;
  if (!rahasia) {
    throw new Error(
      "BETTER_AUTH_SECRET belum diisi. Tanpa ini sesi tidak bisa ditandatangani. " +
        "Buat nilai acak: openssl rand -base64 32",
    );
  }

  if (!turnstileSiap()) {
    console.error(
      "[auth] Turnstile tidak lengkap; endpoint masuk berjalan TANPA captcha. " +
        "Isi TURNSTILE_SITE_KEY dan TURNSTILE_SECRET dua-duanya untuk menyalakannya.",
    );
  }

  return betterAuth({
    database: prismaAdapter(db(), { provider: "postgresql" }),
    secret: rahasia,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    emailAndPassword: {
      enabled: true,
      // Tidak ada alur "lupa sandi" lewat surel: aplikasi ini belum punya layanan
      // pengiriman surel, dan tombol yang tidak mengirim apa pun adalah
      // kontrol mati. Sandi disetel ulang lewat skrip yang sama.
      disableSignUp: true,
      minPasswordLength: 12,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    /**
     * Pembatas laju percobaan masuk.
     *
     * `enabled: true` disengaja: bawaannya hanya menyala di produksi, dan
     * kontrol yang tidak pernah menyala saat pengembangan tidak pernah teruji.
     *
     * Disimpan di basis data, bukan memori proses. Deployment hari ini satu
     * replika, tetapi hitungan di memori akan diam-diam mati begitu replika
     * ditambah: penyerang yang dilempar ke pod lain mendapat jatah baru.
     *
     * Aturan bawaan Better Auth untuk /sign-in* adalah 3 per 10 detik. Itu
     * peredam ledakan permintaan, bukan peredam penebakan sandi — 3 per 10
     * detik berarti sekitar 25.000 percobaan sehari. customRules MENGGANTI
     * jendela itu, bukan menumpuknya, jadi yang berlaku setelah ini hanya
     * satu: 5 percobaan per 10 menit per alamat IP.
     */
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 600, max: 5 },
      },
    },
    /**
     * Cloudflare Turnstile di depan pencocokan sandi.
     *
     * Didaftarkan HANYA bila site key dan secret dua-duanya terisi. Secret
     * tanpa site key berarti widget tidak pernah muncul, token tidak pernah
     * terbit, dan setiap percobaan masuk ditolak: satu salah ketik env
     * mengunci seluruh admin dari CMS. Di sini kita memilih lapisan captcha
     * yang mati ketimbang pintu yang terkunci — sandi dan pembatas laju masih
     * berjaga, dan matinya lapisan ini berteriak di log.
     *
     * expectedAction mengikat token pada formulir masuk. Tanpanya, token dari
     * widget mana pun di domain kita — termasuk formulir kontak publik — bisa
     * dipakai untuk menembus endpoint ini.
     */
    plugins: [
      admin({
        ac,
        roles: {
          admin: peranAdmin,
          bendahara,
          warga,
        },
        defaultRole: "warga",
        adminRoles: ["admin"],
      }),
      ...(turnstileSiap()
        ? [
            captcha({
              provider: "cloudflare-turnstile",
              secretKey: process.env.TURNSTILE_SECRET!,
              endpoints: ["/sign-in/email"],
              expectedAction: AKSI_MASUK,
              allowedHostnames: hostnameTurnstile(),
            }),
          ]
        : []),
    ],
  });
}

// Tipenya diturunkan dari fungsi pembuatnya, bukan ditulis sebagai
// ReturnType<typeof betterAuth>: yang terakhir itu bentuk generiknya, dan
// instance sebenarnya bertipe lebih sempit sehingga keduanya tidak cocok.
type Auth = ReturnType<typeof buat>;

const g = globalThis as unknown as { __auth?: Auth };

export function auth(): Auth {
  return (g.__auth ??= buat());
}
