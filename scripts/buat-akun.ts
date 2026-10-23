import { config } from "dotenv";

// .env.local lebih dulu, baru .env. `dotenv/config` saja hanya memuat .env,
// sementara berkas yang dipakai di sini .env.local, sehingga DATABASE_URL
// tidak pernah terbaca kecuali kebetulan sudah ada di lingkungan shell.
config({ path: [".env.local", ".env"], quiet: true });
import { createInterface } from "node:readline/promises";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "../lib/db";

/**
 * Membuat akun CMS, atau menyetel ulang sandi akun yang sudah ada.
 *
 * Pendaftaran mandiri dimatikan di lib/auth.ts, jadi akun hanya lahir dari
 * sini. Skrip ini memakai betterAuth yang sama dengan aplikasi, hanya dengan
 * `disableSignUp: false`, supaya sandinya di-hash persis dengan cara yang
 * dipakai saat login memverifikasinya. Meng-hash sendiri di sini akan
 * menghasilkan akun yang tampak jadi tetapi tidak pernah bisa masuk.
 */
/**
 * Membaca tiga isian.
 *
 * Kalau dijalankan orang di terminal, bertanya satu per satu. Kalau masukannya
 * dialirkan (pipa, berkas, CI), seluruh barisnya dibaca sekaligus: bertanya
 * lewat readline pada stdin yang bukan TTY berhenti menggantung di pertanyaan
 * kedua tanpa pesan apa pun.
 */
async function baca(): Promise<[string, string, string, string]> {
  if (!process.stdin.isTTY) {
    const potongan: Buffer[] = [];
    for await (const c of process.stdin) potongan.push(c as Buffer);
    const baris = Buffer.concat(potongan).toString("utf8").split(/\r?\n/);
    return [baris[0] ?? "", baris[1] ?? "", baris[2] ?? "", baris[3] ?? ""];
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const nama = await rl.question("Nama lengkap                          : ");
  const email = await rl.question("Email                                 : ");
  const sandi = await rl.question("Sandi (min 12)                        : ");
  const peran = await rl.question("Peran (admin/bendahara/warga, default admin): ");
  rl.close();
  return [nama, email, sandi, peran];
}

async function main() {
  const [namaMentah, emailMentah, sandiMentah, peranMentah] = await baca();
  const nama = namaMentah.trim();
  const email = emailMentah.trim().toLowerCase();
  const sandi = sandiMentah.trim();
  const peranInput = peranMentah.trim().toLowerCase();
  const role =
    peranInput === "bendahara" || peranInput === "warga"
      ? peranInput
      : "admin";

  if (!nama || !email || !sandi) {
    throw new Error("Nama, email, dan sandi wajib diisi.");
  }
  if (sandi.length < 12) {
    throw new Error(`Sandi terlalu pendek: ${sandi.length} karakter, minimal 12.`);
  }

  const rahasia = process.env.BETTER_AUTH_SECRET;
  if (!rahasia) throw new Error("BETTER_AUTH_SECRET belum diisi.");

  const a = betterAuth({
    database: prismaAdapter(db(), { provider: "postgresql" }),
    secret: rahasia,
    emailAndPassword: { enabled: true, minPasswordLength: 12 },
  });

  const sudahAda = await db().user.findUnique({ where: { email } });
  if (sudahAda) {
    throw new Error(
      `Email ${email} sudah terdaftar. Hapus akunnya lebih dulu, atau pakai email lain.`,
    );
  }

  await a.api.signUpEmail({ body: { name: nama, email, password: sandi } });
  await db().user.update({
    where: { email },
    data: { role },
  });
  console.log(`\nAkun dibuat: ${email} (Peran: ${role})\nMasuk lewat /masuk`);
}

main()
  .catch((e) => {
    console.error("\nGagal:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());
