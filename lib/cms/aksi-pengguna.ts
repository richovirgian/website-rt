"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { catatAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import {
  penggunaBaruMasuk,
  ubahPeranMasuk,
  ubahSandiMasuk,
} from "@/lib/cms/skema";

/**
 * Semua aksi di sini memerlukan izin `users.manage` (hanya Admin).
 *
 * Aktor dicatat ke audit log untuk setiap hasil, termasuk yang ditolak.
 */

/**
 * Menambahkan pengguna baru. Sandi di-hash lewat Better Auth supaya format
 * hash di tabel account identik dengan proses pendaftaran resmi.
 */
export async function buatPengguna(mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("users.manage");
  if (!cek.ok) return cek;
  const aktor = { aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name };

  const hasil = penggunaBaruMasuk.safeParse(mentah);
  if (!hasil.success) return galatDariZod(hasil.error);

  const d = hasil.data;
  const email = d.email.trim().toLowerCase();

  const sudahAda = await db().user.findUnique({ where: { email } });
  if (sudahAda) {
    return {
      ok: false,
      pesan: `Email ${email} sudah terdaftar.`,
      galat: { email: "Email sudah terdaftar. Gunakan email lain." },
    };
  }

  try {
    const res = await auth().api.createUser({
      headers: await headers(),
      body: { name: d.nama.trim(), email, password: d.sandi, role: d.role },
    });

    // Pastikan peran tersimpan sesuai pilihan Admin.
    await db().user.update({
      where: { id: res.user.id },
      data: { role: d.role },
    });

    await catatAudit({
      ...aktor,
      aksi: "pengguna.buat",
      entitas: "user",
      entitasId: res.user.id,
      metadata: { email, role: d.role },
    });
    revalidatePath("/admin/pengguna");
    return { ok: true, id: res.user.id };
  } catch (e) {
    console.error("[pengguna] gagal membuat pengguna:", e);
    return { ok: false, pesan: "Gagal membuat pengguna." };
  }
}

/**
 * Mengubah peran pengguna.
 *
 * Pengaman: Admin terakhir tidak boleh menurunkan perannya sendiri, supaya
 * aplikasi tidak kehilangan satu-satunya akun pengelola.
 */
export async function ubahPeranPengguna(
  userId: string,
  mentah: unknown,
): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("users.manage");
  if (!cek.ok) return cek;
  const aktor = { aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name };

  const hasil = ubahPeranMasuk.safeParse(mentah);
  if (!hasil.success) return { ok: false, pesan: "Pilihan peran tidak sah." };

  const roleBaru = hasil.data.role;

  if (cek.sesi.user.id === userId && roleBaru !== "admin") {
    const adminLain = await db().user.count({
      where: { role: "admin", id: { not: userId } },
    });
    if (adminLain === 0) {
      await catatAudit({
        ...aktor,
        aksi: "pengguna.ubah_peran",
        entitas: "user",
        entitasId: userId,
        hasil: "ditolak",
        metadata: { alasan: "admin_terakhir" },
      });
      return {
        ok: false,
        pesan:
          "Anda tidak dapat menurunkan peran sendiri karena Anda satu-satunya Admin.",
      };
    }
  }

  try {
    const sebelum = await db().user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    await db().user.update({ where: { id: userId }, data: { role: roleBaru } });
    await catatAudit({
      ...aktor,
      aksi: "pengguna.ubah_peran",
      entitas: "user",
      entitasId: userId,
      metadata: { dari: sebelum?.role ?? null, ke: roleBaru },
    });
    revalidatePath("/admin/pengguna");
    return { ok: true, id: userId };
  } catch (e) {
    console.error("[pengguna] gagal mengubah peran:", e);
    return { ok: false, pesan: "Gagal memperbarui peran pengguna." };
  }
}

/** Menyetel ulang kata sandi pengguna. */
export async function ubahSandiPengguna(
  userId: string,
  mentah: unknown,
): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("users.manage");
  if (!cek.ok) return cek;

  const hasil = ubahSandiMasuk.safeParse(mentah);
  if (!hasil.success) {
    const pesan = hasil.error.issues[0]?.message ?? "Sandi minimal 12 karakter.";
    return { ok: false, pesan, galat: { sandi: pesan } };
  }

  try {
    await auth().api.setUserPassword({
      headers: await headers(),
      body: { userId, newPassword: hasil.data.sandi },
    });
    // Sandinya sendiri tidak pernah masuk log.
    await catatAudit({
      aktorId: cek.sesi.user.id,
      aktorNama: cek.sesi.user.name,
      aksi: "pengguna.setel_sandi",
      entitas: "user",
      entitasId: userId,
    });
    return { ok: true, id: userId };
  } catch (e) {
    console.error("[pengguna] gagal mengubah sandi:", e);
    return { ok: false, pesan: "Gagal mengubah kata sandi pengguna." };
  }
}

/**
 * Menghapus akun pengguna. Tidak boleh menghapus akun sendiri, dan tidak
 * boleh menghapus Admin terakhir.
 */
export async function hapusPengguna(userId: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("users.manage");
  if (!cek.ok) return cek;
  const aktor = { aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name };

  if (cek.sesi.user.id === userId) {
    return {
      ok: false,
      pesan: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.",
    };
  }

  const target = await db().user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, pesan: "Pengguna tidak ditemukan." };

  if (target.role === "admin") {
    const sisa = await db().user.count({
      where: { role: "admin", id: { not: userId } },
    });
    if (sisa === 0) {
      return { ok: false, pesan: "Tidak dapat menghapus Admin terakhir." };
    }
  }

  try {
    await db().user.delete({ where: { id: userId } });
    await catatAudit({
      ...aktor,
      aksi: "pengguna.hapus",
      entitas: "user",
      entitasId: userId,
      metadata: { email: target.email, role: target.role },
    });
    revalidatePath("/admin/pengguna");
    return { ok: true, id: userId };
  } catch (e) {
    console.error("[pengguna] gagal menghapus pengguna:", e);
    return { ok: false, pesan: "Gagal menghapus pengguna." };
  }
}
