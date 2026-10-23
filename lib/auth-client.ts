"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

/**
 * Klien auth untuk komponen peramban.
 *
 * baseURL sengaja dikosongkan supaya memakai asal halaman yang sedang dibuka.
 * Menuliskannya dari NEXT_PUBLIC_* akan membekukan alamat saat build, dan
 * image yang sama dipakai di beberapa lingkungan.
 */
export const authClient = createAuthClient({
  plugins: [adminClient()],
});
