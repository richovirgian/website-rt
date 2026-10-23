"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { GalatBisnis, ubahGalat } from "@/lib/galat-bisnis";
import { periksaLampiran } from "@/lib/lampiran";
import { beriNotifikasiAman, userIdAdmin } from "@/lib/notifikasi";
import { nomorBerikut } from "@/lib/nomor";
import { wargaAktifDariUser } from "@/lib/komunikasi-kueri";
import { ajukanSuratMasuk, jenisSuratMasuk, kirimUlangSuratMasuk, putusanSuratMasuk } from "@/lib/cms/skema-komunikasi";
import { LABEL_STATUS_SURAT } from "@/lib/komunikasi-label";

/**
 * Aksi surat pengantar.
 *
 * Warga (`letters.request.own`) mengajukan, memperbaiki, dan membatalkan
 * pengajuannya sendiri. Admin (`letters.approve`) menyetujui, meminta revisi,
 * atau menolak. Jenis dan templat surat diatur lewat `settings.manage`.
 * Perpindahan status memakai `updateMany` dengan syarat status asal, jadi dua
 * orang yang memutuskan bersamaan tidak bisa menimpa satu sama lain.
 */

const muatUlang = () => {
  revalidatePath("/admin/surat", "layout");
};

const P2002 = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/* ------------------------------------------------------------ Jenis surat */

export async function simpanJenisSurat(id: string | null, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("settings.manage");
  if (!cek.ok) return cek;
  const h = jenisSuratMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const j = id
      ? await db().jenisSurat.update({ where: { id }, data: h.data })
      : await db().jenisSurat.create({ data: h.data });
    await db().auditLog.create({
      data: dataAudit({
        aktorId: cek.sesi.user.id,
        aktorNama: cek.sesi.user.name,
        aksi: id ? "surat.jenis_ubah" : "surat.jenis_buat",
        entitas: "jenis_surat",
        entitasId: j.id,
        metadata: { nama: j.nama, kode: j.kode },
      }),
    });
    muatUlang();
    return { ok: true, id: j.id };
  } catch (e) {
    if (P2002(e)) {
      const pesan = "Nama atau kode jenis surat itu sudah dipakai.";
      return { ok: false, pesan, galat: { nama: pesan } };
    }
    console.error("[surat] gagal menyimpan jenis:", e);
    return { ok: false, pesan: "Gagal menyimpan jenis surat." };
  }
}

/* ------------------------------------------------------------ Pengajuan */

/** Warga mengajukan surat dengan lampiran opsional (maks. 3 berkas, 2 MB). */
export async function ajukanSurat(formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("letters.request.own");
  if (!cek.ok) return cek;

  const h = ajukanSuratMasuk.safeParse({
    jenisSuratId: formData.get("jenisSuratId") ?? "",
    keperluan: formData.get("keperluan") ?? "",
  });
  if (!h.success) return galatDariZod(h.error);

  const lamp = await periksaLampiran(formData);
  if (!lamp.ok) return { ok: false, pesan: lamp.pesan, galat: { lampiran: lamp.pesan } };

  const warga = await wargaAktifDariUser(cek.sesi.user.id);
  if (!warga) return { ok: false, pesan: "Akun Anda belum dihubungkan ke data warga yang aktif. Hubungi pengurus." };

  const jenis = await db().jenisSurat.findFirst({ where: { id: h.data.jenisSuratId, aktif: true }, select: { id: true, nama: true } });
  if (!jenis) return { ok: false, pesan: "Jenis surat tidak ditemukan.", galat: { jenisSuratId: "Jenis surat tidak tersedia." } };

  try {
    const p = await db().$transaction(async (tx) => {
      const baru = await tx.pengajuanSurat.create({
        data: {
          jenisSuratId: jenis.id,
          pemohonWargaId: warga.id,
          pemohonUserId: cek.sesi.user.id,
          keperluan: h.data.keperluan,
          lampiran: { create: lamp.berkas },
        },
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: "surat.ajukan",
          entitas: "pengajuan_surat",
          entitasId: baru.id,
          metadata: { jenis: jenis.nama, lampiran: lamp.berkas.length },
        }),
      });
      return baru;
    });
    await beriNotifikasiAman({
      userIds: await userIdAdmin(),
      jenis: "surat-baru",
      judul: "Pengajuan surat baru",
      isi: `${warga.namaLengkap} mengajukan ${jenis.nama}.`,
      tautan: `/admin/surat/${p.id}`,
      kunci: `surat-baru:${p.id}`,
    });
    muatUlang();
    return { ok: true, id: p.id };
  } catch (e) {
    return ubahGalat(e, "Gagal mengajukan surat.", "surat");
  }
}

/** Pemohon memperbaiki pengajuan yang diminta revisi, lalu mengirim ulang. */
export async function kirimUlangSurat(id: string, formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("letters.request.own");
  if (!cek.ok) return cek;

  const h = kirimUlangSuratMasuk.safeParse({ keperluan: formData.get("keperluan") ?? "" });
  if (!h.success) return galatDariZod(h.error);
  const lamp = await periksaLampiran(formData);
  if (!lamp.ok) return { ok: false, pesan: lamp.pesan, galat: { lampiran: lamp.pesan } };

  try {
    const p = await db().$transaction(async (tx) => {
      // Syarat pemilik dan status berada di pernyataan yang sama dengan perubahannya.
      const r = await tx.pengajuanSurat.updateMany({
        where: { id, pemohonUserId: cek.sesi.user.id, status: "REVISI" },
        data: { status: "DIAJUKAN", keperluan: h.data.keperluan, alasan: null },
      });
      if (r.count !== 1) throw new GalatBisnis("Pengajuan ini tidak bisa dikirim ulang.");
      if (lamp.berkas.length > 0) {
        await tx.lampiran.createMany({ data: lamp.berkas.map((b) => ({ ...b, pengajuanSuratId: id })) });
      }
      await tx.auditLog.create({
        data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi: "surat.kirim_ulang", entitas: "pengajuan_surat", entitasId: id }),
      });
      return tx.pengajuanSurat.findUnique({ where: { id }, select: { jenisSurat: { select: { nama: true } } } });
    });
    await beriNotifikasiAman({
      userIds: await userIdAdmin(),
      jenis: "surat-ulang",
      judul: "Pengajuan surat diperbaiki",
      isi: `${cek.sesi.user.name} mengirim ulang ${p?.jenisSurat.nama ?? "pengajuan surat"}.`,
      tautan: `/admin/surat/${id}`,
      kunci: `surat-ulang:${id}:${Date.now()}`,
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal mengirim ulang.", "surat");
  }
}

export async function batalkanSurat(id: string): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("letters.request.own");
  if (!cek.ok) return cek;
  try {
    const r = await db().pengajuanSurat.updateMany({
      where: { id, pemohonUserId: cek.sesi.user.id, status: { in: ["DIAJUKAN", "REVISI"] } },
      data: { status: "DIBATALKAN" },
    });
    if (r.count !== 1) return { ok: false, pesan: "Pengajuan ini tidak bisa dibatalkan." };
    await db().auditLog.create({
      data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi: "surat.batalkan", entitas: "pengajuan_surat", entitasId: id }),
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal membatalkan pengajuan.", "surat");
  }
}

/**
 * Admin memutuskan pengajuan: setujui (menerbitkan nomor dan menyalin templat),
 * minta revisi, atau tolak. Hanya pengajuan berstatus DIAJUKAN yang bisa diputuskan.
 */
export async function putuskanSurat(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("letters.approve");
  if (!cek.ok) return cek;
  const aktor = { id: cek.sesi.user.id, nama: cek.sesi.user.name };

  const h = putusanSuratMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const { tindakan, alasan } = h.data;
  const statusBaru = tindakan === "SETUJUI" ? "DISETUJUI" : tindakan === "REVISI" ? "REVISI" : "DITOLAK";

  try {
    const p = await db().$transaction(async (tx) => {
      const lama = await tx.pengajuanSurat.findUnique({
        where: { id },
        select: { status: true, pemohonUserId: true, jenisSurat: { select: { nama: true, kode: true, templat: true } } },
      });
      if (!lama) throw new GalatBisnis("Pengajuan tidak ditemukan.");

      const data: Prisma.PengajuanSuratUpdateManyMutationInput = {
        status: statusBaru,
        alasan: tindakan === "SETUJUI" ? null : alasan,
        diputuskanOleh: aktor.nama,
        diputuskanPada: new Date(),
      };
      if (tindakan === "SETUJUI") {
        // Nomor dan salinan templat ditetapkan bersama persetujuan. Bila ada
        // yang lebih dulu memutuskan, throw di bawah membatalkan seluruh transaksi
        // termasuk kenaikan nomor, jadi tidak ada lubang nomor.
        data.nomor = await nomorBerikut(tx, lama.jenisSurat.kode);
        data.templatSnapshot = lama.jenisSurat.templat;
      }
      const r = await tx.pengajuanSurat.updateMany({ where: { id, status: "DIAJUKAN" }, data });
      if (r.count !== 1) throw new GalatBisnis("Pengajuan ini sudah diputuskan.");

      await tx.auditLog.create({
        data: dataAudit({
          aktorId: aktor.id,
          aktorNama: aktor.nama,
          aksi: `surat.${tindakan.toLowerCase()}`,
          entitas: "pengajuan_surat",
          entitasId: id,
          metadata: tindakan === "SETUJUI" ? { nomor: data.nomor as string } : { alasan },
        }),
      });
      return lama;
    });

    await beriNotifikasiAman({
      userIds: [p.pemohonUserId],
      jenis: "surat-status",
      judul: `Surat Anda: ${LABEL_STATUS_SURAT[statusBaru].toLowerCase()}`,
      isi:
        tindakan === "SETUJUI"
          ? `${p.jenisSurat.nama} sudah disetujui dan siap dicetak.`
          : `${p.jenisSurat.nama}: ${alasan}`,
      tautan: `/admin/surat/${id}`,
      kunci: `surat:${id}:${statusBaru}:${tindakan === "REVISI" ? Date.now() : ""}`,
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal memutuskan pengajuan.", "surat");
  }
}
