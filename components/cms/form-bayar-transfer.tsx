"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";
import { ajukanTransfer } from "@/lib/cms/aksi-pembayaran";
import { hariIni } from "@/lib/uang";
import { Bidang } from "@/components/cms/bidang";
import { bolehDiunggah, kecilkanFormData } from "@/components/cms/kecilkan-gambar";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_SEKUNDER, TOMBOL_UTAMA } from "@/components/cms/gaya";

/**
 * Warga mengirim bukti transfer. Berkas diperiksa ukurannya di peramban
 * supaya tidak menunggu unggahan yang pasti ditolak; pemeriksaan sebenarnya
 * (isi berkas) tetap di server.
 */
export function FormBayarTransfer({
  tagihanId,
  nominal,
  rekening,
}: {
  tagihanId: string;
  nominal: string;
  rekening: { bank: string; nomor: string; atasNama: string } | null;
}) {
  const router = useRouter();
  const [proses, mulai] = useTransition();
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [salin, setSalin] = useState(false);
  const berkas = useRef<HTMLInputElement>(null);

  async function salinNomor() {
    if (!rekening) return;
    try {
      await navigator.clipboard.writeText(rekening.nomor);
      setSalin(true);
      setTimeout(() => setSalin(false), 2000);
    } catch {
      /* clipboard tidak tersedia: pengguna bisa menyalin manual */
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="judul-rekening" className="rounded-2xl border border-line bg-krem-2/60 p-5">
        <h2 id="judul-rekening" className="text-sm font-semibold uppercase tracking-wider text-muted-fg">Transfer ke rekening</h2>
        {rekening ? (
          <>
            <p className="mt-2 text-base text-hijau-tua">{rekening.bank}</p>
            <p className="mt-1 flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-wide text-hijau">{rekening.nomor}</span>
              <button type="button" onClick={salinNomor} className={`${TOMBOL_SEKUNDER} h-10 px-3`}>
                {salin ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {salin ? "Tersalin" : "Salin"}
              </button>
            </p>
            <p className="mt-1 text-sm text-muted-fg">a.n. {rekening.atasNama}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-red-800">Rekening RT belum diatur pengurus. Hubungi bendahara.</p>
        )}
        <p className="mt-4 text-sm text-hijau-tua">
          Jumlah yang harus ditransfer: <strong className="text-lg text-hijau">{nominal}</strong>
        </p>
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPesan(null);
          setGalat({});
          const f = berkas.current?.files?.[0];
          if (f && !bolehDiunggah(f)) {
            setGalat({ bukti: "Berkas terlalu besar. PDF maksimal 2 MB, foto maksimal 20 MB." });
            return;
          }
          const data = new FormData(e.currentTarget);
          mulai(async () => {
            // Foto kamera diperkecil dulu supaya unggahan cepat dan tidak ditolak karena ukuran.
            await kecilkanFormData(data, "bukti");
            const h = await ajukanTransfer(tagihanId, data);
            if (h.ok) {
              router.push("/admin/tagihan-saya");
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
        <Bidang id="b-tanggal" label="Tanggal transfer" wajib galat={galat.tanggalBayar}>
          <input id="b-tanggal" name="tanggalBayar" type="date" defaultValue={hariIni()} max={hariIni()} required className={KELAS_ISIAN} aria-describedby="b-tanggal-info" aria-invalid={galat.tanggalBayar ? true : undefined} />
        </Bidang>
        <Bidang id="b-bukti" label="Foto atau PDF bukti transfer" wajib galat={galat.bukti} bantuan="JPG, PNG, WebP, atau PDF. Foto diperkecil otomatis; PDF maksimal 2 MB.">
          <input ref={berkas} id="b-bukti" name="bukti" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className={`${KELAS_ISIAN} h-auto py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-hijau file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-krem`} aria-describedby="b-bukti-info" aria-invalid={galat.bukti ? true : undefined} />
        </Bidang>
        <Bidang id="b-catatan" label="Catatan (opsional)" galat={galat.catatan}>
          <input id="b-catatan" name="catatan" maxLength={300} className={KELAS_ISIAN} aria-describedby="b-catatan-info" />
        </Bidang>
        <p className="text-sm text-muted-fg">
          Tagihan baru dinyatakan lunas setelah bendahara memeriksa dan menyetujui bukti ini.
        </p>
        <div>
          <button type="submit" disabled={proses || !rekening} className={`${TOMBOL_UTAMA} w-full sm:w-auto`}>
            {proses && <Loader2 className="size-4 animate-spin" />}
            {proses ? "Mengirim..." : "Kirim bukti transfer"}
          </button>
        </div>
      </form>
    </div>
  );
}
