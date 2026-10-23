import { db } from "@/lib/db";

type Catatan = {
  aktorId: string | null;
  aktorNama: string;
  aksi: string;
  entitas: string;
  entitasId?: string | null;
  hasil?: "berhasil" | "ditolak";
  /** Jangan isi sandi, token, atau data pembayaran sensitif. */
  metadata?: Record<string, string | number | boolean | null>;
};

/** Bentuk data baris audit, untuk ditulis di dalam `$transaction` yang sama dengan tindakannya. */
export function dataAudit(c: Catatan) {
  return {
    aktorId: c.aktorId,
    aktorNama: c.aktorNama,
    aksi: c.aksi,
    entitas: c.entitas,
    entitasId: c.entitasId ?? null,
    hasil: c.hasil ?? "berhasil",
    metadata: c.metadata ?? undefined,
  };
}

/**
 * Menulis satu baris audit log.
 *
 * Kegagalan menulis log tidak boleh membatalkan tindakan yang sudah berhasil,
 * tetapi juga tidak boleh diam: galatnya dicatat ke log server supaya
 * lubangnya terlihat.
 *
 * Untuk operasi yang harus atomik dengan log-nya (misalnya verifikasi
 * pembayaran), tulis AuditLog di dalam `prisma.$transaction` yang sama, bukan
 * lewat fungsi ini.
 */
export async function catatAudit(c: Catatan): Promise<void> {
  try {
    await db().auditLog.create({
      data: {
        aktorId: c.aktorId,
        aktorNama: c.aktorNama,
        aksi: c.aksi,
        entitas: c.entitas,
        entitasId: c.entitasId ?? null,
        hasil: c.hasil ?? "berhasil",
        metadata: c.metadata ?? undefined,
      },
    });
  } catch (e) {
    console.error("[audit] gagal menulis log:", c.aksi, e);
  }
}
