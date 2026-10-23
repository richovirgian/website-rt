"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { batalkanPembayaran, tolakPembayaran, verifikasiPembayaran } from "@/lib/cms/aksi-pembayaran";
import { useAksi } from "@/components/cms/use-aksi";
import { DialogKonfirmasi } from "@/components/cms/dialog-konfirmasi";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_BAHAYA, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Setujui atau tolak transfer yang menunggu. Menyetujui membuka dialog konfirmasi. */
export function AksiVerifikasi({ id, ringkas }: { id: string; ringkas: string }) {
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [alasan, setAlasan] = useState("");
  const setuju = useAksi();
  const tolak = useAksi();

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={() => setKonfirmasi(true)} disabled={setuju.proses} className={TOMBOL_UTAMA}>
          <Check className="size-4" aria-hidden="true" />
          Setujui
        </button>
      </div>
      <PesanAksi pesan={setuju.pesan && !setuju.pesan.ok ? setuju.pesan : null} />

      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-red-700 underline-offset-4 hover:underline marker:hidden [&::-webkit-details-marker]:hidden">
          Tolak pembayaran
        </summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            tolak.jalankan(() => tolakPembayaran(id, { alasan }), { berhasil: "Pembayaran ditolak." });
          }}
          className="mt-3 flex max-w-80 flex-col gap-2"
        >
          <label htmlFor={`tolak-${id}`} className="text-xs font-medium text-hijau-tua">Alasan penolakan (dibaca warga)</label>
          <input id={`tolak-${id}`} value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={300} minLength={5} required className={KELAS_ISIAN} aria-invalid={tolak.galat.alasan ? true : undefined} />
          {tolak.galat.alasan && <p role="alert" className="text-xs text-red-700">{tolak.galat.alasan}</p>}
          <PesanAksi pesan={tolak.pesan && !tolak.pesan.ok ? tolak.pesan : null} />
          <button type="submit" disabled={tolak.proses} className={TOMBOL_BAHAYA}>
            {tolak.proses && <Loader2 className="size-4 animate-spin" />}
            Tolak
          </button>
        </form>
      </details>

      <DialogKonfirmasi
        terbuka={konfirmasi}
        judul="Setujui pembayaran ini?"
        keterangan={`${ringkas} Tagihan akan ditandai lunas, dicatat sebagai kas masuk, dan kuitansi diterbitkan. Pastikan dana sudah benar-benar masuk ke rekening.`}
        labelYa="Setujui"
        sedangProses={setuju.proses}
        onBatal={() => setKonfirmasi(false)}
        onYa={() => {
          setuju.jalankan(() => verifikasiPembayaran(id), { berhasil: "Pembayaran disetujui.", selesai: () => setKonfirmasi(false) });
        }}
      />
    </div>
  );
}

/** Membatalkan pembayaran yang sudah terverifikasi (salah catat). Tagihan kembali belum dibayar. */
export function AksiBatalkanPembayaran({ id }: { id: string }) {
  const [alasan, setAlasan] = useState("");
  const { proses, galat, pesan, jalankan } = useAksi();
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-semibold text-red-700 underline-offset-4 hover:underline marker:hidden [&::-webkit-details-marker]:hidden">
        Batalkan pembayaran
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          jalankan(() => batalkanPembayaran(id, { alasan }), { berhasil: "Pembayaran dibatalkan." });
        }}
        className="mt-3 flex max-w-80 flex-col gap-2"
      >
        <p className="text-xs text-muted-fg">Tagihan kembali belum dibayar, dan kas dikoreksi dengan transaksi pembalik. Catatan lama tidak dihapus.</p>
        <label htmlFor={`batal-${id}`} className="text-xs font-medium text-hijau-tua">Alasan</label>
        <input id={`batal-${id}`} value={alasan} onChange={(e) => setAlasan(e.target.value)} maxLength={300} minLength={5} required className={KELAS_ISIAN} aria-invalid={galat.alasan ? true : undefined} />
        {galat.alasan && <p role="alert" className="text-xs text-red-700">{galat.alasan}</p>}
        <PesanAksi pesan={pesan && !pesan.ok ? pesan : null} />
        <button type="submit" disabled={proses} className={TOMBOL_BAHAYA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          Ya, batalkan pembayaran
        </button>
      </form>
    </details>
  );
}
