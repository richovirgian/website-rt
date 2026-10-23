"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { buatAkunWarga } from "@/lib/cms/aksi-warga";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import { KELAS_ISIAN, TOMBOL_UTAMA } from "@/components/cms/gaya";

/** Membuat akun login untuk seorang warga dan menautkannya ke datanya. */
export function FormAkunWarga({ wargaId }: { wargaId: string }) {
  const [n, setN] = useState({ email: "", sandi: "" });
  const { proses, galat, pesan, jalankan } = useAksi();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(() => buatAkunWarga(wargaId, n), {
          berhasil: "Akun dibuat. Sampaikan email dan sandi sementara ini kepada warga.",
          selesai: () => setN({ email: "", sandi: "" }),
        });
      }}
      className="flex max-w-xl flex-col gap-4"
    >
      <PesanAksi pesan={pesan} />
      <Bidang id="akun-email" label="Email" wajib galat={galat.email}>
        <input id="akun-email" type="email" value={n.email} onChange={(e) => setN((s) => ({ ...s, email: e.target.value }))} required autoComplete="off" className={KELAS_ISIAN} aria-describedby="akun-email-info" />
      </Bidang>
      <Bidang id="akun-sandi" label="Sandi sementara" wajib galat={galat.sandi} bantuan="Minimal 12 karakter. Sampaikan ke warga lewat jalur yang aman.">
        <input id="akun-sandi" type="text" value={n.sandi} onChange={(e) => setN((s) => ({ ...s, sandi: e.target.value }))} required minLength={12} autoComplete="off" className={KELAS_ISIAN} aria-describedby="akun-sandi-info" />
      </Bidang>
      <div>
        <button type="submit" disabled={proses} className={TOMBOL_UTAMA}>
          {proses && <Loader2 className="size-4 animate-spin" />}
          {proses ? "Membuat akun..." : "Buat akun"}
        </button>
      </div>
    </form>
  );
}
