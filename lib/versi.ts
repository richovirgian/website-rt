import { version } from "@/package.json";

/**
 * Versi aplikasi yang sedang berjalan.
 *
 * Nomornya diambil dari package.json, bukan diketik ulang: angka yang ditulis
 * tangan di dua tempat pasti berbeda suatu hari tanpa ada yang menyadarinya.
 *
 * Nomor versi saja belum menjawab "build mana yang sedang tayang" — beberapa
 * deploy bisa berbagi versi yang sama. Kalau pipeline menyuntikkan
 * NEXT_PUBLIC_BUILD (misalnya SHA commit pendek), nilainya ikut ditampilkan.
 */
export const versi = version;

const build = process.env.NEXT_PUBLIC_BUILD?.trim();

export const labelVersi = build ? `v${version} · ${build}` : `v${version}`;
