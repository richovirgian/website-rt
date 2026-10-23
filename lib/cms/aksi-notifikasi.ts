"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sesi } from "@/lib/cms/sesi";

/** Menandai satu notifikasi milik pengguna yang masuk sebagai dibaca. Mengembalikan tautannya. */
export async function bukaNotifikasi(id: string): Promise<string | null> {
  const s = await sesi();
  if (!s) return null;
  // Syarat userId di dalam pernyataan: tidak bisa menandai atau membaca milik orang lain.
  await db().notifikasi.updateMany({ where: { id, userId: s.user.id, dibacaPada: null }, data: { dibacaPada: new Date() } });
  const n = await db().notifikasi.findFirst({ where: { id, userId: s.user.id }, select: { tautan: true } });
  revalidatePath("/admin", "layout");
  return n?.tautan ?? null;
}

export async function tandaiSemuaDibaca(): Promise<void> {
  const s = await sesi();
  if (!s) return;
  await db().notifikasi.updateMany({ where: { userId: s.user.id, dibacaPada: null }, data: { dibacaPada: new Date() } });
  revalidatePath("/admin", "layout");
}
