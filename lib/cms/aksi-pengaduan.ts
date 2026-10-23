"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { periksaIzinAksi } from "@/lib/cms/sesi";
import { dataAudit } from "@/lib/audit";
import { galatDariZod, type HasilAksi } from "@/lib/aksi";
import { GalatBisnis, ubahGalat } from "@/lib/galat-bisnis";
import { periksaLampiran } from "@/lib/lampiran";
import { beriNotifikasiAman, userIdAdmin } from "@/lib/notifikasi";
import { nomorBerikut } from "@/lib/nomor";
import { rumahIdMilik } from "@/lib/pembayaran-kueri";
import { pengaduanMasuk, statusPengaduanMasuk, tanggapanMasuk } from "@/lib/cms/skema-komunikasi";
import { LABEL_STATUS_PENGADUAN, TUJUAN_PENGADUAN } from "@/lib/komunikasi-label";

/**
 * Aksi pengaduan. Warga (`complaints.create.own`) melapor dan menanggapi
 * pengaduannya SENDIRI; Admin (`complaints.assign`) menugaskan dan mengubah
 * status. Pengaduan tidak pernah tampil ke warga lain.
 */

const muatUlang = () => revalidatePath("/admin/pengaduan", "layout");

export async function buatPengaduan(formData: FormData): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("complaints.create.own");
  if (!cek.ok) return cek;

  const h = pengaduanMasuk.safeParse({
    kategori: formData.get("kategori") ?? "",
    judul: formData.get("judul") ?? "",
    deskripsi: formData.get("deskripsi") ?? "",
    lokasi: formData.get("lokasi") ?? "",
  });
  if (!h.success) return galatDariZod(h.error);
  const lamp = await periksaLampiran(formData);
  if (!lamp.ok) return { ok: false, pesan: lamp.pesan, galat: { lampiran: lamp.pesan } };

  const rumahId = await rumahIdMilik(cek.sesi.user.id);

  try {
    const p = await db().$transaction(async (tx) => {
      const baru = await tx.pengaduan.create({
        data: {
          ...h.data,
          nomor: await nomorBerikut(tx, "ADU"),
          pelaporUserId: cek.sesi.user.id,
          pelaporNama: cek.sesi.user.name,
          rumahId,
          lampiran: { create: lamp.berkas },
          pembaruan: { create: { status: "BARU", catatan: "Pengaduan dibuat.", oleh: cek.sesi.user.name, dariPelapor: true } },
        },
      });
      await tx.auditLog.create({
        data: dataAudit({ aktorId: cek.sesi.user.id, aktorNama: cek.sesi.user.name, aksi: "pengaduan.buat", entitas: "pengaduan", entitasId: baru.id, metadata: { nomor: baru.nomor, kategori: baru.kategori } }),
      });
      return baru;
    });
    await beriNotifikasiAman({
      userIds: await userIdAdmin(),
      jenis: "pengaduan-baru",
      judul: "Pengaduan baru",
      isi: `${p.nomor}: ${p.judul}`,
      tautan: `/admin/pengaduan/${p.id}`,
      kunci: `aduan-baru:${p.id}`,
    });
    muatUlang();
    return { ok: true, id: p.id };
  } catch (e) {
    return ubahGalat(e, "Gagal mengirim pengaduan.", "pengaduan");
  }
}

/** Pelapor menambahkan keterangan selama pengaduan belum ditutup. */
export async function tambahTanggapan(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("complaints.create.own");
  if (!cek.ok) return cek;
  const h = tanggapanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);

  try {
    const p = await db().pengaduan.findFirst({
      where: { id, pelaporUserId: cek.sesi.user.id, status: { not: "DITUTUP" } },
      select: { id: true, nomor: true },
    });
    if (!p) return { ok: false, pesan: "Pengaduan tidak ditemukan atau sudah ditutup." };

    const u = await db().pembaruanPengaduan.create({
      data: { pengaduanId: id, catatan: h.data.catatan, oleh: cek.sesi.user.name, dariPelapor: true },
    });
    await beriNotifikasiAman({
      userIds: await userIdAdmin(),
      jenis: "pengaduan-tanggapan",
      judul: "Tanggapan pelapor",
      isi: `${p.nomor}: ${h.data.catatan.slice(0, 120)}`,
      tautan: `/admin/pengaduan/${id}`,
      kunci: `aduan-tanggapan:${u.id}`,
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal mengirim tanggapan.", "pengaduan");
  }
}

/**
 * Admin mengubah status, menunjuk penanggung jawab, dan/atau mencatat tindak
 * lanjut. Perpindahan status divalidasi terhadap TUJUAN_PENGADUAN dan
 * dilakukan dengan syarat status asal di dalam pernyataan UPDATE.
 */
export async function ubahStatusPengaduan(id: string, mentah: unknown): Promise<HasilAksi> {
  const cek = await periksaIzinAksi("complaints.assign");
  if (!cek.ok) return cek;
  const h = statusPengaduanMasuk.safeParse(mentah);
  if (!h.success) return galatDariZod(h.error);
  const { status, penanggungJawab, catatan } = h.data;

  try {
    const hasil = await db().$transaction(async (tx) => {
      const lama = await tx.pengaduan.findUnique({ where: { id }, select: { status: true, nomor: true, judul: true, pelaporUserId: true, penanggungJawab: true } });
      if (!lama) throw new GalatBisnis("Pengaduan tidak ditemukan.");

      const berubah = status !== lama.status;
      if (berubah && !TUJUAN_PENGADUAN[lama.status].includes(status)) {
        throw new GalatBisnis(`Status tidak bisa langsung diubah dari ${LABEL_STATUS_PENGADUAN[lama.status]} ke ${LABEL_STATUS_PENGADUAN[status]}.`);
      }
      if (!berubah && penanggungJawab === lama.penanggungJawab && !catatan) {
        throw new GalatBisnis("Tidak ada perubahan untuk disimpan.");
      }

      const r = await tx.pengaduan.updateMany({
        where: { id, status: lama.status },
        data: {
          status,
          penanggungJawab,
          ...(status === "SELESAI" && lama.status !== "SELESAI" ? { selesaiPada: new Date() } : {}),
          ...(status === "DIPROSES" && lama.status === "SELESAI" ? { selesaiPada: null } : {}),
        },
      });
      if (r.count !== 1) throw new GalatBisnis("Pengaduan baru saja diubah orang lain. Muat ulang halaman.");

      const u = await tx.pembaruanPengaduan.create({
        data: {
          pengaduanId: id,
          status: berubah ? status : null,
          catatan:
            catatan ??
            (berubah ? `Status diubah menjadi ${LABEL_STATUS_PENGADUAN[status]}.` : `Penanggung jawab: ${penanggungJawab ?? "dikosongkan"}.`),
          oleh: cek.sesi.user.name,
        },
      });
      await tx.auditLog.create({
        data: dataAudit({
          aktorId: cek.sesi.user.id,
          aktorNama: cek.sesi.user.name,
          aksi: "pengaduan.ubah",
          entitas: "pengaduan",
          entitasId: id,
          metadata: { dari: lama.status, ke: status, penanggungJawab: penanggungJawab ?? null },
        }),
      });
      return { lama, u };
    });

    await beriNotifikasiAman({
      userIds: [hasil.lama.pelaporUserId],
      jenis: "pengaduan-status",
      judul: `Pengaduan ${hasil.lama.nomor}: ${LABEL_STATUS_PENGADUAN[status].toLowerCase()}`,
      isi: hasil.u.catatan.slice(0, 160),
      tautan: `/admin/pengaduan/${id}`,
      kunci: `aduan:${hasil.u.id}`,
    });
    muatUlang();
    return { ok: true, id };
  } catch (e) {
    return ubahGalat(e, "Gagal menyimpan perubahan.", "pengaduan");
  }
}
