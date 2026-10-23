"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { GalatBisnis, ubahGalat } from "@/lib/galat-bisnis";
import { olahGambar } from "@/lib/gambar";
import { buatSlug, isiBawaanArtikel, isiBawaanStruktur, isiKeTeks } from "@/lib/situs";
import { artikelMasuk, fotoMasuk, pengurusMasuk, ubahFotoMasuk } from "@/lib/cms/skema-situs";
import { tanggalUtc } from "@/lib/uang";

/**
 * Aksi pengelolaan konten situs publik: artikel, galeri, dan struktur
 * pengurus. Semuanya memerlukan `content.manage` (Admin).
 *
 * Gambar selalu diolah ulang di server (lib/gambar.ts) sebelum disimpan.
 * Bendera `pengaturan_situs` dinyalakan pada tindakan pertama untuk tiap
 * jenis konten, agar situs publik berpindah dari isi bawaan ke database.
 */

const P2002 = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

const muatUlang = () => {
  revalidatePath("/admin/situs", "layout");
  revalidatePath("/", "layout");
};

type Jenis = "artikelDiatur" | "strukturDiatur" | "galeriDiatur";
const nyalakan = (tx: Prisma.TransactionClient, jenis: Jenis) =>
  tx.pengaturanSitus.upsert({ where: { id: "situs" }, create: { id: "situs", [jenis]: true }, update: { [jenis]: true } });

const catat = (tx: Prisma.TransactionClient, cek: { sesi: { user: { id: string; name: string } } }, aksi: string, entitas: string, id: string, metadata?: Record<string, string | number | boolean | null>) =>
  tx.auditLog.create({ data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi, entitas, entitasId: id, metadata }) });

/* ---------------------------------------------------------------- Artikel */

async function slugUnik(tx: Prisma.TransactionClient, judul: string): Promise<string> {
  const dasar = buatSlug(judul);
  for (let i = 0; i < 50; i++) {
    const calon = i === 0 ? dasar : `${dasar}-${i + 1}`;
    if (!(await tx.artikelSitus.findUnique({ where: { slug: calon }, select: { id: true } }))) return calon;
  }
  return `${dasar}-${Date.now()}`;
}

export async function simpanArtikel(id: string | null, formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;

  const h = artikelMasuk.safeParse({
    judul: formData.get("judul") ?? "",
    kategori: formData.get("kategori") ?? "",
    ringkas: formData.get("ringkas") ?? "",
    isi: formData.get("isi") ?? "",
    penulis: formData.get("penulis") ?? "",
    tanggal: formData.get("tanggal") ?? "",
    status: formData.get("status") ?? "",
  });
  if (!h.success) return galatDariZod(h.error);
  const d = h.data;

  const berkasCover = formData.get("cover");
  const adaCover = berkasCover instanceof File && berkasCover.size > 0;
  let cover: Awaited<ReturnType<typeof olahGambar>> | null = null;
  if (adaCover) {
    cover = await olahGambar(berkasCover);
    if (!cover.ok) return { ok: false, pesan: cover.pesan, galat: { cover: cover.pesan } };
  }
  const hapusCover = formData.get("hapusCover") === "on";

  try {
    const a = await db().$transaction(async (tx) => {
      const lama = id ? await tx.artikelSitus.findUnique({ where: { id }, select: { coverId: true } }) : null;
      if (id && !lama) throw new GalatBisnis("Artikel tidak ditemukan.");

      let coverId: string | null | undefined; // undefined = tidak diubah
      if (cover?.ok) {
        const g = await tx.gambarSitus.create({ data: { tipe: cover.gambar.tipe, lebar: cover.gambar.lebar, tinggi: cover.gambar.tinggi, ukuran: cover.gambar.ukuran, data: cover.gambar.data } });
        coverId = g.id;
      } else if (hapusCover) coverId = null;

      const data = {
        judul: d.judul,
        kategori: d.kategori as "KEGIATAN",
        ringkas: d.ringkas,
        isi: d.isi,
        penulis: d.penulis,
        tanggal: tanggalUtc(d.tanggal),
        status: d.status,
        ...(coverId !== undefined ? { coverId } : {}),
      };
      const simpan = id
        ? await tx.artikelSitus.update({ where: { id }, data })
        : await tx.artikelSitus.create({ data: { ...data, slug: await slugUnik(tx, d.judul) } });

      // Gambar sampul lama yang tidak dipakai lagi dibuang agar tidak menumpuk.
      if (coverId !== undefined && lama?.coverId && lama.coverId !== coverId) {
        await tx.gambarSitus.deleteMany({ where: { id: lama.coverId, foto: { none: {} }, artikel: { none: {} } } });
      }
      await nyalakan(tx, "artikelDiatur");
      await catat(tx, cek, id ? "situs.artikel_ubah" : "situs.artikel_buat", "artikel_situs", simpan.id, { judul: d.judul, status: d.status });
      return simpan;
    });
    muatUlang();
    return { ok: true, id: a.id };
  } catch (e) {
    if (P2002(e)) return { ok: false, pesan: "Alamat artikel bentrok. Coba lagi." };
    return ubahGalat(e, "Gagal menyimpan artikel.", "situs");
  }
}

export async function hapusArtikel(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  try {
    await db().$transaction(async (tx) => {
      const a = await tx.artikelSitus.delete({ where: { id }, select: { judul: true, coverId: true } });
      if (a.coverId) await tx.gambarSitus.deleteMany({ where: { id: a.coverId, foto: { none: {} }, artikel: { none: {} } } });
      await catat(tx, cek, "situs.artikel_hapus", "artikel_situs", id, { judul: a.judul });
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menghapus artikel.", "situs");
  }
}

/** Menyalin artikel contoh bawaan ke database supaya bisa disunting. Hanya bila belum dikelola. */
export async function isiContohArtikel(): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  try {
    await db().$transaction(async (tx) => {
      const p = await tx.pengaturanSitus.findUnique({ where: { id: "situs" } });
      if (p?.artikelDiatur) throw new GalatBisnis("Artikel sudah dikelola dari panel.");
      for (const a of isiBawaanArtikel()) {
        await tx.artikelSitus.upsert({
          where: { slug: a.slug },
          create: { slug: a.slug, judul: a.judul, kategori: a.kategori.toUpperCase() as "KEGIATAN", ringkas: a.ringkas, isi: isiKeTeks(a.isi), penulis: a.penulis, tanggal: tanggalUtc(a.tanggal), status: "TERBIT" },
          update: {},
        });
      }
      await nyalakan(tx, "artikelDiatur");
      await catat(tx, cek, "situs.artikel_contoh", "artikel_situs", "contoh");
    });
    muatUlang();
    return { ok: true };
  } catch (e) {
    return ubahGalat(e, "Gagal menyalin artikel contoh.", "situs");
  }
}

/* ------------------------------------------------------------------ Galeri */

export async function tambahFoto(formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  const h = fotoMasuk.safeParse({ judul: formData.get("judul") ?? "", keterangan: formData.get("keterangan") ?? "" });
  if (!h.success) return galatDariZod(h.error);
  const g = await olahGambar(formData.get("foto"));
  if (!g.ok) return { ok: false, pesan: g.pesan, galat: { foto: g.pesan } };

  try {
    const f = await db().$transaction(async (tx) => {
      const gambar = await tx.gambarSitus.create({ data: { tipe: g.gambar.tipe, lebar: g.gambar.lebar, tinggi: g.gambar.tinggi, ukuran: g.gambar.ukuran, data: g.gambar.data } });
      const maks = await tx.fotoGaleri.aggregate({ _max: { urutan: true } });
      const foto = await tx.fotoGaleri.create({ data: { gambarId: gambar.id, judul: h.data.judul, keterangan: h.data.keterangan, urutan: (maks._max.urutan ?? 0) + 1 } });
      await nyalakan(tx, "galeriDiatur");
      await catat(tx, cek, "situs.foto_tambah", "foto_galeri", foto.id, { judul: h.data.judul, ukuran: g.gambar.ukuran });
      return foto;
    });
    muatUlang();
    return { ok: true, id: f.id };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan foto.", "situs");
  }
}

export async function ubahFoto(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  const h = ubahFotoMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  try {
    await db().$transaction(async (tx) => {
      await tx.fotoGaleri.update({ where: { id }, data: h.data });
      await catat(tx, cek, "situs.foto_ubah", "foto_galeri", id);
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan foto.", "situs");
  }
}

export async function hapusFoto(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  try {
    await db().$transaction(async (tx) => {
      const f = await tx.fotoGaleri.delete({ where: { id }, select: { gambarId: true, judul: true } });
      await tx.gambarSitus.deleteMany({ where: { id: f.gambarId, foto: { none: {} }, artikel: { none: {} } } });
      await catat(tx, cek, "situs.foto_hapus", "foto_galeri", id, { judul: f.judul });
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menghapus foto.", "situs");
  }
}

/* ---------------------------------------------------------------- Struktur */

/** Satu Ketua saja. Memeriksa di dalam transaksi yang sama dengan penulisannya. */
async function adaKetuaLain(tx: Prisma.TransactionClient, kecualiId: string | null): Promise<boolean> {
  return (await tx.pengurusSitus.count({ where: { tingkat: "KETUA", ...(kecualiId ? { id: { not: kecualiId } } : {}) } })) > 0;
}

export async function simpanPengurus(id: string | null, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  const h = pengurusMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  try {
    const p = await db().$transaction(async (tx) => {
      if (h.data.tingkat === "KETUA" && (await adaKetuaLain(tx, id))) {
        throw new GalatBisnis("Sudah ada Ketua RT. Ubah yang ada, atau pindahkan tingkatnya lebih dulu.");
      }
      const simpan = id ? await tx.pengurusSitus.update({ where: { id }, data: h.data }) : await tx.pengurusSitus.create({ data: h.data });
      await nyalakan(tx, "strukturDiatur");
      await catat(tx, cek, id ? "situs.pengurus_ubah" : "situs.pengurus_tambah", "pengurus_situs", simpan.id, { jabatan: h.data.jabatan });
      return simpan;
    });
    muatUlang();
    return { ok: true, id: p.id };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan pengurus.", "situs");
  }
}

export async function hapusPengurus(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  try {
    await db().$transaction(async (tx) => {
      const p = await tx.pengurusSitus.delete({ where: { id }, select: { jabatan: true } });
      await catat(tx, cek, "situs.pengurus_hapus", "pengurus_situs", id, { jabatan: p.jabatan });
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menghapus pengurus.", "situs");
  }
}

/** Menyalin susunan pengurus bawaan ke database supaya namanya bisa diganti. */
export async function isiContohStruktur(): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("content.manage");
  if (!cek.ok) return cek;
  try {
    await db().$transaction(async (tx) => {
      const p = await tx.pengaturanSitus.findUnique({ where: { id: "situs" } });
      if (p?.strukturDiatur) throw new GalatBisnis("Struktur sudah dikelola dari panel.");
      const { ketua, inti, seksi } = isiBawaanStruktur;
      const baris = [
        { tingkat: "KETUA" as const, ...ketua, urutan: 0 },
        ...inti.map((x, i) => ({ tingkat: "INTI" as const, ...x, urutan: i })),
        ...seksi.map((x, i) => ({ tingkat: "SEKSI" as const, ...x, urutan: i })),
      ];
      await tx.pengurusSitus.createMany({ data: baris });
      await nyalakan(tx, "strukturDiatur");
      await catat(tx, cek, "situs.struktur_contoh", "pengurus_situs", "contoh");
    });
    muatUlang();
    return { ok: true };
  } catch (e) {
    return ubahGalat(e, "Gagal menyalin struktur.", "situs");
  }
}
