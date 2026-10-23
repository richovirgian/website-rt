"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { dekripsi, enkripsi, hashIdentitas } from "@/lib/enkripsi";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { akunWargaMasuk, galatWajib, wargaManualMasuk, wargaMasuk } from "@/lib/cms/skema-warga";

/**
 * Aksi data warga.
 *
 * NIK dienkripsi sebelum disimpan. Membuka NIK utuh hanya lewat
 * `tampilkanNik`, yang memerlukan izin `residents.read_identity` (Admin) dan
 * selalu tercatat di audit log.
 */

const sudahAda = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
const dipakai = (e: unknown) =>
  e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003";

const PESAN_NIK_GANDA = "NIK ini sudah terdaftar pada warga lain.";

/** Bidang NIK untuk disimpan. Null bila tidak ada NIK baru. */
function bidangNik(nik: string | null) {
  if (!nik) return null;
  return {
    nikEnkripsi: enkripsi(nik),
    nikHash: hashIdentitas(nik),
    nikAkhir4: nik.slice(-4),
  };
}

/**
 * Satu keluarga hanya boleh punya satu kepala keluarga yang aktif. Dicek di
 * dalam transaksi yang sama dengan penulisannya.
 */
async function kepalaGanda(
  tx: Prisma.TransactionClient,
  keluargaId: string,
  kecualiWargaId?: string,
) {
  const n = await tx.warga.count({
    where: {
      keluargaId,
      hubungan: "KEPALA_KELUARGA",
      statusDomisili: "AKTIF",
      ...(kecualiWargaId ? { id: { not: kecualiWargaId } } : {}),
    },
  });
  return n > 0;
}

const PESAN_KEPALA_GANDA =
  "Keluarga ini sudah memiliki kepala keluarga yang aktif. Ubah hubungan kepala yang lama lebih dulu.";

export async function buatWarga(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.create");
  if (!cek.ok) return cek;

  const h = wargaMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const kurang = galatWajib(h.data);
  if (Object.keys(kurang).length) return { ok: false, pesan: "Ada isian yang belum benar.", galat: kurang };
  const { nik, ...data } = h.data;

  try {
    const w = await db().$transaction(async (tx) => {
      if (
        data.hubungan === "KEPALA_KELUARGA" &&
        data.statusDomisili === "AKTIF" &&
        (await kepalaGanda(tx, data.keluargaId))
      ) {
        throw new Error("KEPALA_GANDA");
      }
      return tx.warga.create({ data: { ...data, ...bidangNik(nik) } });
    });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "warga.buat",
      entitas: "warga",
      entitasId: w.id,
      metadata: { adaNik: Boolean(nik) },
    });
    revalidatePath("/admin/warga", "layout");
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id: w.id };
  } catch (e) {
    if (e instanceof Error && e.message === "KEPALA_GANDA") {
      return { ok: false, pesan: PESAN_KEPALA_GANDA, galat: { hubungan: PESAN_KEPALA_GANDA } };
    }
    if (sudahAda(e)) return { ok: false, pesan: PESAN_NIK_GANDA, galat: { nik: PESAN_NIK_GANDA } };
    if (dipakai(e)) return { ok: false, pesan: "Keluarga tidak ditemukan." };
    console.error("[warga] gagal membuat:", e);
    return { ok: false, pesan: "Gagal menyimpan data warga." };
  }
}

/**
 * Tambah warga manual dari halaman Warga. Keluarga bisa yang sudah ada di
 * rumah itu (dan masih tinggal), atau dibuat baru bersama warganya dalam
 * satu transaksi: tidak akan ada keluarga kosong bila penyimpanan warga gagal.
 */
export async function buatWargaManual(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.create");
  if (!cek.ok) return cek;

  const h = wargaManualMasuk.safeParse(mentah);
  if (!h.success) {
    const galat: Record<string, string> = {};
    for (const i of h.error.issues) {
      const kunci = i.path[0] === "warga" ? String(i.path[1] ?? "form") : String(i.path[0] ?? "form");
      galat[kunci] ??= i.message;
    }
    return { ok: false, pesan: "Ada isian yang belum benar.", galat };
  }
  const { rumahId, keluargaId, statusHunian, tanggalMasuk, warga } = h.data;
  const { nik, ...data } = warga;

  try {
    const w = await db().$transaction(async (tx) => {
      let idKeluarga: string;
      if (keluargaId === "BARU") {
        const k = await tx.keluarga.create({ data: { rumahId, statusHunian, tanggalMasuk } });
        idKeluarga = k.id;
      } else {
        const k = await tx.keluarga.findFirst({ where: { id: keluargaId, rumahId, tanggalKeluar: null }, select: { id: true } });
        if (!k) throw new Error("KELUARGA_TIDAK_SAH");
        idKeluarga = k.id;
      }
      if (data.hubungan === "KEPALA_KELUARGA" && (await kepalaGanda(tx, idKeluarga))) throw new Error("KEPALA_GANDA");
      const baru = await tx.warga.create({ data: { ...data, keluargaId: idKeluarga, statusDomisili: "AKTIF", ...bidangNik(nik) } });
      await tx.auditLog.create({
        data: {
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: "warga.buat",
          entitas: "warga",
          entitasId: baru.id,
          hasil: "berhasil",
          metadata: { adaNik: Boolean(nik), keluargaBaru: keluargaId === "BARU", manual: true },
        },
      });
      return baru;
    });
    revalidatePath("/admin/warga", "layout");
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id: w.id };
  } catch (e) {
    if (e instanceof Error && e.message === "KEPALA_GANDA") return { ok: false, pesan: PESAN_KEPALA_GANDA, galat: { hubungan: PESAN_KEPALA_GANDA } };
    if (e instanceof Error && e.message === "KELUARGA_TIDAK_SAH") return { ok: false, pesan: "Keluarga itu bukan penghuni aktif rumah yang dipilih.", galat: { keluargaId: "Pilih keluarga yang sesuai." } };
    if (sudahAda(e)) return { ok: false, pesan: PESAN_NIK_GANDA, galat: { nik: PESAN_NIK_GANDA } };
    console.error("[warga] gagal menambah manual:", e);
    return { ok: false, pesan: "Gagal menyimpan data warga." };
  }
}

export async function ubahWarga(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.update");
  if (!cek.ok) return cek;

  const h = wargaMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  // NIK lama tidak dikirim ke peramban: kosong boleh bila warga sudah punya NIK.
  const lama = await db().warga.findUnique({ where: { id }, select: { nikEnkripsi: true } });
  if (!lama) return { ok: false, pesan: "Data warga tidak ditemukan." };
  const kurang = galatWajib(h.data, Boolean(lama.nikEnkripsi));
  if (Object.keys(kurang).length) return { ok: false, pesan: "Ada isian yang belum benar.", galat: kurang };
  const { nik, ...data } = h.data;

  try {
    await db().$transaction(async (tx) => {
      if (
        data.hubungan === "KEPALA_KELUARGA" &&
        data.statusDomisili === "AKTIF" &&
        (await kepalaGanda(tx, data.keluargaId, id))
      ) {
        throw new Error("KEPALA_GANDA");
      }
      // NIK kosong berarti tidak diubah.
      await tx.warga.update({ where: { id }, data: { ...data, ...bidangNik(nik) } });
    });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "warga.ubah",
      entitas: "warga",
      entitasId: id,
      metadata: { nikDiganti: Boolean(nik) },
    });
    revalidatePath("/admin/warga", "layout");
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Error && e.message === "KEPALA_GANDA") {
      return { ok: false, pesan: PESAN_KEPALA_GANDA, galat: { hubungan: PESAN_KEPALA_GANDA } };
    }
    if (sudahAda(e)) return { ok: false, pesan: PESAN_NIK_GANDA, galat: { nik: PESAN_NIK_GANDA } };
    console.error("[warga] gagal mengubah:", e);
    return { ok: false, pesan: "Gagal menyimpan perubahan." };
  }
}

/** Hanya untuk salah input. Warga yang pindah cukup ditandai statusnya. */
export async function hapusWarga(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("residents.update");
  if (!cek.ok) return cek;

  try {
    const w = await db().warga.findUnique({ where: { id }, select: { userId: true } });
    if (!w) return { ok: false, pesan: "Data warga tidak ditemukan." };
    if (w.userId) {
      return {
        ok: false,
        pesan: "Warga ini masih punya akun login. Hapus akunnya di halaman Pengguna lebih dulu.",
      };
    }
    await db().warga.delete({ where: { id } });
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "warga.hapus",
      entitas: "warga",
      entitasId: id,
    });
    revalidatePath("/admin/warga", "layout");
    revalidatePath("/admin/rumah", "layout");
    return { ok: true, id };
  } catch (e) {
    if (dipakai(e)) {
      return { ok: false, pesan: "Data warga ini sudah dipakai modul lain, jadi tidak bisa dihapus. Tandai statusnya saja." };
    }
    console.error("[warga] gagal menghapus:", e);
    return { ok: false, pesan: "Gagal menghapus data warga." };
  }
}

/**
 * Membuat akun login untuk warga dan menautkannya. Perlu `users.manage` dan
 * `residents.update`. Bila penautan gagal, akun yang baru dibuat dihapus lagi
 * supaya tidak ada akun yatim.
 */
export async function buatAkunWarga(wargaId: string, mentah: unknown): Promise<HasilAksi> {
  const izinAkun = await periksaIzinAksi("users.manage");
  if (!izinAkun.ok) return izinAkun;
  const izinWarga = await periksaIzinAksi("residents.update");
  if (!izinWarga.ok) return izinWarga;

  const h = akunWargaMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const { email, sandi } = h.data;

  const w = await db().warga.findUnique({
    where: { id: wargaId },
    select: { id: true, namaLengkap: true, userId: true },
  });
  if (!w) return { ok: false, pesan: "Data warga tidak ditemukan." };
  if (w.userId) return { ok: false, pesan: "Warga ini sudah punya akun login." };

  if (await db().user.findUnique({ where: { email } })) {
    return { ok: false, pesan: "Email sudah dipakai.", galat: { email: "Email sudah terdaftar." } };
  }

  let userId: string | null = null;
  try {
    const res = await auth().api.createUser({
      headers: await headers(),
      body: { name: w.namaLengkap, email, password: sandi, role: "warga" },
    });
    userId = res.user.id;
    await db().user.update({ where: { id: userId }, data: { role: "warga" } });
    await db().warga.update({ where: { id: wargaId }, data: { userId } });

    await catatAudit({
      aktorId: izinAkun.sesi.user.id,
      aktorNama: izinAkun.sesi.user.name,
      aksi: "warga.buat_akun",
      entitas: "warga",
      entitasId: wargaId,
      metadata: { email },
    });
    revalidatePath("/admin/warga", "layout");
    revalidatePath("/admin/pengguna");
    return { ok: true, id: userId };
  } catch (e) {
    console.error("[warga] gagal membuat akun:", e);
    if (userId) await db().user.delete({ where: { id: userId } }).catch(() => {});
    return { ok: false, pesan: "Gagal membuat akun untuk warga ini." };
  }
}

export type HasilNik =
  | { ok: true; nik: string }
  | { ok: false; pesan: string };

/** Membuka NIK utuh. Selalu dicatat di audit log, juga saat ditolak. */
export async function tampilkanNik(wargaId: string): Promise<HasilNik> {
  const cek = await periksaIzinAksi("residents.read_identity");
  if (!cek.ok) return cek;
  const aktor = { aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name };

  try {
    const w = await db().warga.findUnique({
      where: { id: wargaId },
      select: { nikEnkripsi: true },
    });
    if (!w?.nikEnkripsi) return { ok: false, pesan: "NIK belum diisi." };

    const nik = dekripsi(w.nikEnkripsi);
    await catatAudit({ ...aktor, aksi: "warga.lihat_nik", entitas: "warga", entitasId: wargaId });
    return { ok: true, nik };
  } catch (e) {
    console.error("[warga] gagal membuka NIK:", e);
    await catatAudit({
      ...aktor,
      aksi: "warga.lihat_nik",
      entitas: "warga",
      entitasId: wargaId,
      hasil: "ditolak",
    });
    return { ok: false, pesan: "NIK tidak dapat dibuka. Periksa ENKRIPSI_KUNCI." };
  }
}
