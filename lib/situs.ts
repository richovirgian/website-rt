import { Camera } from "lucide-react";
import { db } from "@/lib/db";
import { semuaArtikel as artikelBawaan, type Artikel } from "@/lib/artikel";
import { LABEL_KATEGORI_ARTIKEL, type KategoriArtikelDb } from "@/lib/kategori-artikel";
import { GALERI, INTI, KETUA, SEKSI, type FotoGaleri, type Pengurus } from "@/lib/profil";

/**
 * Konten situs publik (artikel, struktur pengurus, galeri).
 *
 * Selama sebuah jenis konten BELUM dikelola dari panel (bendera di
 * `pengaturan_situs` masih false), situs memakai isi bawaan di lib/profil.ts
 * dan lib/artikel.ts, supaya situs tidak tampil kosong. Begitu Admin
 * menambah atau menyalin isi pertama, bendera menyala dan situs memakai
 * database sepenuhnya.
 *
 * Bila database tidak terjangkau, situs publik tetap tampil dengan isi
 * bawaan, bukan error: ini halaman yang dilihat siapa pun.
 */

type Bendera = { artikel: boolean; struktur: boolean; galeri: boolean };

export async function bendera(): Promise<Bendera> {
  try {
    const p = await db().pengaturanSitus.findUnique({ where: { id: "situs" } });
    return { artikel: !!p?.artikelDiatur, struktur: !!p?.strukturDiatur, galeri: !!p?.galeriDiatur };
  } catch {
    return { artikel: false, struktur: false, galeri: false };
  }
}

/* ---------------------------------------------------------------- Artikel */


/** Memecah teks isi menjadi blok: baris "## Judul" membuka subjudul, baris kosong memisahkan paragraf. */
export function parseIsiArtikel(teks: string): Artikel["isi"] {
  const blok: Artikel["isi"] = [];
  let kini: { judul?: string; paragraf: string[] } = { paragraf: [] };
  const tutup = () => {
    if (kini.judul || kini.paragraf.length) blok.push(kini);
  };
  for (const para of teks.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const t = para.trim();
    if (!t) continue;
    if (t.startsWith("## ")) {
      tutup();
      const [baris1, ...sisa] = t.split("\n");
      kini = { judul: baris1!.slice(3).trim(), paragraf: [] };
      const lanjut = sisa.join("\n").trim();
      if (lanjut) kini.paragraf.push(lanjut);
    } else {
      kini.paragraf.push(t);
    }
  }
  tutup();
  return blok;
}

/** Mengubah blok kembali menjadi teks untuk disunting. */
export const isiKeTeks = (isi: Artikel["isi"]): string =>
  isi.map((b) => [b.judul ? `## ${b.judul}` : "", ...b.paragraf].filter(Boolean).join("\n\n")).join("\n\n");

export function buatSlug(judul: string): string {
  const dasar = judul
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return dasar || "artikel";
}

const dariDb = (a: {
  slug: string; judul: string; kategori: KategoriArtikelDb; tanggal: Date; penulis: string; ringkas: string; isi: string; coverId: string | null;
}): Artikel => ({
  slug: a.slug,
  judul: a.judul,
  kategori: LABEL_KATEGORI_ARTIKEL[a.kategori],
  tanggal: a.tanggal.toISOString().slice(0, 10),
  penulis: a.penulis,
  ringkas: a.ringkas,
  isi: parseIsiArtikel(a.isi),
  cover: a.coverId ? `/media/${a.coverId}` : null,
});

export async function artikelPublik(): Promise<Artikel[]> {
  if (!(await bendera()).artikel) return artikelBawaan();
  try {
    const r = await db().artikelSitus.findMany({ where: { status: "TERBIT" }, orderBy: [{ tanggal: "desc" }, { dibuatPada: "desc" }] });
    return r.map(dariDb);
  } catch {
    return artikelBawaan();
  }
}

export async function artikelPublikBySlug(slug: string): Promise<Artikel | undefined> {
  return (await artikelPublik()).find((a) => a.slug === slug);
}

/* ---------------------------------------------------------------- Struktur */

export type StrukturPublik = { ketua: Pengurus | null; inti: Pengurus[]; seksi: Pengurus[] };

export async function strukturPublik(): Promise<StrukturPublik> {
  const bawaan: StrukturPublik = { ketua: KETUA, inti: INTI, seksi: SEKSI };
  if (!(await bendera()).struktur) return bawaan;
  try {
    const r = await db().pengurusSitus.findMany({ orderBy: [{ urutan: "asc" }, { jabatan: "asc" }] });
    const ke = (t: "KETUA" | "INTI" | "SEKSI") => r.filter((x) => x.tingkat === t).map((x) => ({ jabatan: x.jabatan, nama: x.nama, tugas: x.tugas }));
    return { ketua: ke("KETUA")[0] ?? null, inti: ke("INTI"), seksi: ke("SEKSI") };
  } catch {
    return bawaan;
  }
}

/* ------------------------------------------------------------------ Galeri */

export async function galeriPublik(): Promise<FotoGaleri[]> {
  if (!(await bendera()).galeri) return GALERI;
  try {
    const r = await db().fotoGaleri.findMany({ orderBy: [{ urutan: "asc" }, { dibuatPada: "desc" }] });
    return r.map((f) => ({
      judul: f.judul,
      keterangan: f.keterangan ?? "",
      foto: `/media/${f.gambarId}`,
      ikon: Camera,
      latar: "from-hijau to-hijau-tua text-krem",
    }));
  } catch {
    return GALERI;
  }
}

/* ----------------------------------------------------------- Isi bawaan */

export const isiBawaanArtikel = artikelBawaan;
export const isiBawaanStruktur = { ketua: KETUA, inti: INTI, seksi: SEKSI };
