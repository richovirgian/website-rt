"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buatPengaduan, tambahTanggapan, ubahStatusPengaduan } from "@/lib/cms/aksi-pengaduan";
import {
  KATEGORI_PENGADUAN,
  LABEL_KATEGORI_PENGADUAN,
  LABEL_STATUS_PENGADUAN,
  TUJUAN_PENGADUAN,
  type StatusPengaduan,
} from "@/lib/komunikasi-label";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { kecilkanFormData } from "@/components/cms/kecilkan-gambar";
import { InputLampiran } from "@/components/cms/input-lampiran";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

export function FormPengaduan() {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [galat, setGalat] = useState<Record<string, string>>({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setPesan(null);
        setGalat({});
        const data = new FormData(e.currentTarget);
        mulai(async () => {
          await kecilkanFormData(data, "lampiran");
          const h = await buatPengaduan(data);
          if (h.ok) {
            router.push(`/admin/pengaduan/${h.id}`);
            router.refresh();
          } else {
            setGalat(h.galat ?? {});
            setPesan({ ok: false, teks: h.pesan });
          }
        });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-[14rem_1fr]">
        <Bidang id="a-kategori" label="Kategori" wajib galat={galat.kategori}>
          <select id="a-kategori" name="kategori" defaultValue="" required className={KELAS_ISIAN} aria-describedby="a-kategori-info">
            <option value="" disabled>Pilih kategori</option>
            {KATEGORI_PENGADUAN.map((k) => (
              <option key={k} value={k}>{LABEL_KATEGORI_PENGADUAN[k]}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id="a-judul" label="Judul singkat" wajib galat={galat.judul} bantuan="Contoh: Lampu jalan depan blok G mati">
          <input id="a-judul" name="judul" maxLength={100} required className={KELAS_ISIAN} aria-describedby="a-judul-info" aria-invalid={galat.judul ? true : undefined} />
        </Bidang>
      </div>
      <Bidang id="a-deskripsi" label="Ceritakan masalahnya" wajib galat={galat.deskripsi}>
        <textarea id="a-deskripsi" name="deskripsi" rows={5} maxLength={1500} required className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="a-deskripsi-info" aria-invalid={galat.deskripsi ? true : undefined} />
      </Bidang>
      <Bidang id="a-lokasi" label="Lokasi kejadian (opsional)" galat={galat.lokasi}>
        <input id="a-lokasi" name="lokasi" maxLength={120} className={KELAS_ISIAN} aria-describedby="a-lokasi-info" />
      </Bidang>
      <InputLampiran label="Foto pendukung (opsional)" galat={galat.lampiran} />
      <p className="text-sm text-muted-fg">Pengaduan hanya dapat dilihat oleh Anda dan pengurus. Tidak ditampilkan kepada warga lain.</p>
      <div>
        <button type="submit" disabled={proses} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Mengirim..." : "Kirim pengaduan"}
        </button>
      </div>
    </form>
  );
}

export function FormTanggapan({ id }: { id: string }) {
  const [catatan, setCatatan] = useState("");
  const { proses, galat, pesan, jalankan } = useAksi();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => tambahTanggapan(id, { catatan }), { berhasil: "Tanggapan terkirim.", selesai: () => setCatatan("") });
      }}
      className="flex flex-col gap-3"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="t-catatan" label="Tambah keterangan" galat={galat.catatan}>
        <textarea id="t-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} maxLength={1000} required className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="t-catatan-info" />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          Kirim
        </button>
      </div>
    </form>
  );
}

/** Admin: ubah status (hanya tujuan yang sah), tunjuk penanggung jawab, catat tindak lanjut. */
export function FormStatusPengaduan({ id, status, penanggungJawab }: { id: string; status: StatusPengaduan; penanggungJawab: string | null }) {
  const [n, setN] = useState({ status, penanggungJawab: penanggungJawab ?? "", catatan: "" });
  const { proses, galat, pesan, jalankan } = useAksi();
  const tujuan = [status, ...TUJUAN_PENGADUAN[status]];

  if (tujuan.length === 1 && status === "DITUTUP") {
    return <p className="text-sm text-muted-fg">Pengaduan ini sudah ditutup dan tidak dapat diubah lagi.</p>;
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => ubahStatusPengaduan(id, n), { berhasil: "Perubahan tersimpan.", selesai: () => setN((s) => ({ ...s, catatan: "" })) });
      }}
      className="flex flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Bidang id="st-status" label="Status" galat={galat.status}>
          <select id="st-status" value={n.status} onChange={(e) => setN((s) => ({ ...s, status: e.target.value as StatusPengaduan }))} className={KELAS_ISIAN}>
            {tujuan.map((t) => (
              <option key={t} value={t}>{LABEL_STATUS_PENGADUAN[t]}{t === status ? " (sekarang)" : ""}</option>
            ))}
          </select>
        </Bidang>
        <Bidang id="st-pj" label="Penanggung jawab" galat={galat.penanggungJawab} bantuan="Contoh: Seksi Kebersihan, Pak Ahmad">
          <input id="st-pj" value={n.penanggungJawab} onChange={(e) => setN((s) => ({ ...s, penanggungJawab: e.target.value }))} maxLength={100} className={KELAS_ISIAN} aria-describedby="st-pj-info" />
        </Bidang>
      </div>
      <Bidang id="st-catatan" label="Catatan tindak lanjut (dibaca pelapor)" galat={galat.catatan}>
        <textarea id="st-catatan" value={n.catatan} onChange={(e) => setN((s) => ({ ...s, catatan: e.target.value }))} rows={3} maxLength={1000} className={`${KELAS_ISIAN} h-auto py-2.5`} aria-describedby="st-catatan-info" />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          Simpan perubahan
        </button>
      </div>
    </form>
  );
}
