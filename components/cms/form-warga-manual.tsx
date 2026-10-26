"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Loader2, Search } from "lucide-react";
import { buatAkunWarga, buatWargaManual } from "@/lib/cms/aksi-warga";
import type { HasilAksi } from "@/lib/aksi";
import {
  HUBUNGAN,
  HUNIAN,
  JENIS_KELAMIN,
  LABEL_HUBUNGAN,
  LABEL_HUNIAN,
  LABEL_JK,
  type Hubungan,
  type Hunian,
} from "@/lib/warga-label";
import { hariIni } from "@/lib/uang";
import { useAksi } from "@/components/cms/use-aksi";
import { Bidang } from "@/components/cms/bidang";
import { PesanAksi } from "@/components/cms/pesan-aksi";
import {
  KELAS_ISIAN,
  TOMBOL_SEKUNDER,
  TOMBOL_UTAMA,
} from "@/components/cms/gaya";

export type PilihanRumah = {
  id: string;
  kode: string;
  keluarga: { id: string; label: string }[];
};

/**
 * Tambah warga secara manual. Alurnya: pilih rumah, pilih keluarga yang
 * sudah ada atau buat keluarga baru, lalu isi data warganya. Untuk keluarga
 * baru, orang pertama otomatis diusulkan sebagai kepala keluarga.
 */
export function FormWargaManual({ rumah }: { rumah: PilihanRumah[] }) {
  const [cari, setCari] = useState("");
  const [fokus, setFokus] = useState(false);
  const [akun, setAkun] = useState({ email: "", sandi: "" });
  const [dibuatId, setDibuatId] = useState<string | null>(null);
  const [rumahId, setRumahId] = useState("");
  const [keluargaId, setKeluargaId] = useState("");
  const [hunian, setHunian] = useState<Hunian>("PEMILIK");
  const [masuk, setMasuk] = useState("");
  const [w, setW] = useState({
    namaLengkap: "",
    nik: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    hubungan: "ANAK" as Hubungan,
    noHp: "",
    pekerjaan: "",
  });
  const { proses, galat, pesan, jalankan } = useAksi();

  // Satu kolom pencarian: cocok dengan kode rumah atau nama kepala keluarga.
  const tersaring = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return rumah.filter(
      (r) =>
        !q ||
        `${r.kode} ${r.keluarga.map((k) => k.label).join(" ")}`
          .toLowerCase()
          .includes(q),
    );
  }, [rumah, cari]);
  const terpilih = rumah.find((r) => r.id === rumahId);
  const ubah =
    (f: keyof typeof w) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setW((s) => ({ ...s, [f]: e.target.value }));
  // Galat dari skema bersarang berkunci "warga.<isian>".
  const g = (k: string) => galat[k] ?? galat[`warga.${k}`];
  const p = (k: string) => ({
    id: `wm-${k}`,
    "aria-describedby": `wm-${k}-info`,
    "aria-invalid": g(k) ? (true as const) : undefined,
    className: KELAS_ISIAN,
  });
  const adaAkun = akun.email.trim() !== "" || akun.sandi !== "";

  async function simpan(): Promise<HasilAksi> {
    const h = await buatWargaManual({
      rumahId,
      keluargaId,
      statusHunian: hunian,
      tanggalMasuk: masuk,
      warga: w,
    });
    if (!h.ok || !adaAkun || !h.id) return h;
    const a = await buatAkunWarga(h.id, akun);
    if (a.ok) return h;
    setDibuatId(h.id);
    return {
      ok: false,
      pesan: `Warga sudah ditambahkan, tetapi akun login gagal dibuat: ${a.pesan} Buat akun dari halaman data warga.`,
      galat: {},
    };
  }

  function pilihRumah(id: string) {
    setRumahId(id);
    const r = rumah.find((x) => x.id === id);
    // Rumah dengan satu keluarga aktif: langsung dipilih. Rumah kosong: usulkan keluarga baru.
    const awal = r
      ? r.keluarga.length === 1
        ? r.keluarga[0]!.id
        : r.keluarga.length === 0
          ? "BARU"
          : ""
      : "";
    setKeluargaId(awal);
    setW((s) => ({
      ...s,
      hubungan: awal === "BARU" ? "KEPALA_KELUARGA" : "ANAK",
    }));
  }
  function pilihKeluarga(id: string) {
    setKeluargaId(id);
    setW((s) => ({
      ...s,
      hubungan:
        id === "BARU"
          ? "KEPALA_KELUARGA"
          : s.hubungan === "KEPALA_KELUARGA"
            ? "ANAK"
            : s.hubungan,
    }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        jalankan(simpan, {
          berhasil: "Warga ditambahkan.",
          ke: () => "/admin/warga",
        });
      }}
      className="flex flex-col gap-6"
    >
      <PesanAksi pesan={pesan} />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-bold text-hijau">
          1. Rumah dan keluarga
        </legend>
        <Bidang
          id="wm-cari"
          label="Rumah"
          wajib
          galat={galat.rumahId}
          bantuan={
            terpilih
              ? undefined
              : "Ketik kode rumah (contoh G-12) atau nama kepala keluarga, lalu pilih dari hasil."
          }
        >
          {terpilih ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-krem-2 px-4 py-3">
              <span className="flex items-center gap-2 font-semibold text-hijau-tua">
                <Check className="size-4 text-hijau" aria-hidden="true" />
                Rumah {terpilih.kode}
                {terpilih.keluarga.length === 0 ? " (kosong)" : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  setRumahId("");
                  setKeluargaId("");
                  setCari("");
                }}
                className="min-h-11 px-2 text-sm font-semibold text-hijau underline-offset-4 hover:underline"
              >
                Ganti
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-fg"
                    aria-hidden="true"
                  />
                  <input
                    id="wm-cari"
                    type="search"
                    value={cari}
                    onChange={(e) => setCari(e.target.value)}
                    onFocus={() => setFokus(true)}
                    onBlur={() => setTimeout(() => setFokus(false), 150)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      // Enter di kolom cari tidak boleh mengirim formulir.
                      e.preventDefault();
                      if (tersaring.length === 1) {
                        pilihRumah(tersaring[0]!.id);
                        setFokus(false);
                      } else setFokus(true);
                    }}
                    placeholder="Cari rumah, contoh: G-12"
                    autoComplete="off"
                    className={`${KELAS_ISIAN} pl-10`}
                    aria-describedby="wm-cari-info"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (tersaring.length === 1 && cari.trim() !== "") {
                      pilihRumah(tersaring[0]!.id);
                      setFokus(false);
                    } else setFokus(true);
                  }}
                  className={TOMBOL_SEKUNDER}
                >
                  Cari
                </button>
              </div>
              {(fokus || cari !== "") && (
                <ul
                  id="wm-hasil"
                  role="listbox"
                  aria-label="Hasil pencarian rumah"
                  className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-line bg-surface shadow-sm"
                >
                  {tersaring.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-muted-fg">
                      Rumah tidak ditemukan.
                    </li>
                  ) : (
                    tersaring.slice(0, 30).map((r) => (
                      <li key={r.id} role="option" aria-selected="false">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            pilihRumah(r.id);
                            setFokus(false);
                          }}
                          className="flex min-h-11 w-full flex-col items-start gap-0.5 border-b border-line px-4 py-2.5 text-left last:border-b-0 hover:bg-hijau/[0.06]"
                        >
                          <span className="font-semibold text-hijau-tua">
                            {r.kode}
                            {r.keluarga.length === 0 ? " (kosong)" : ""}
                          </span>
                          {r.keluarga[0] && (
                            <span className="text-xs text-muted-fg">
                              {r.keluarga
                                .map((k) => k.label.split(" · ")[0])
                                .join(", ")}
                            </span>
                          )}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          )}
        </Bidang>

        {terpilih && (
          <Bidang
            id="wm-keluargaId"
            label="Keluarga"
            wajib
            galat={galat.keluargaId}
          >
            <select
              id="wm-keluargaId"
              value={keluargaId}
              onChange={(e) => pilihKeluarga(e.target.value)}
              required
              className={KELAS_ISIAN}
              aria-describedby="wm-keluargaId-info"
            >
              <option value="">Pilih keluarga</option>
              {terpilih.keluarga.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
              <option value="BARU">+ Buat keluarga baru di rumah ini</option>
            </select>
          </Bidang>
        )}

        {keluargaId === "BARU" && (
          <div className="grid gap-4 rounded-xl bg-krem-2 p-4 sm:grid-cols-2">
            <Bidang
              id="wm-statusHunian"
              label="Status hunian"
              wajib
              galat={galat.statusHunian}
            >
              <select
                id="wm-statusHunian"
                value={hunian}
                onChange={(e) => setHunian(e.target.value as Hunian)}
                className={KELAS_ISIAN}
              >
                {HUNIAN.map((h) => (
                  <option key={h} value={h}>
                    {LABEL_HUNIAN[h]}
                  </option>
                ))}
              </select>
            </Bidang>
            <Bidang
              id="wm-tanggalMasuk"
              label="Tanggal masuk (opsional)"
              galat={galat.tanggalMasuk}
            >
              <input
                id="wm-tanggalMasuk"
                type="date"
                value={masuk}
                max={hariIni()}
                onChange={(e) => setMasuk(e.target.value)}
                className={KELAS_ISIAN}
                aria-describedby="wm-tanggalMasuk-info"
              />
            </Bidang>
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-bold text-hijau">
          2. Data warga
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang
            id="wm-namaLengkap"
            label="Nama lengkap"
            wajib
            galat={g("namaLengkap")}
            className="sm:col-span-2"
          >
            <input
              {...p("namaLengkap")}
              value={w.namaLengkap}
              onChange={ubah("namaLengkap")}
              maxLength={100}
              required
              autoComplete="off"
            />
          </Bidang>
          <Bidang
            id="wm-nik"
            label="NIK"
            wajib
            galat={g("nik")}
            bantuan="16 digit. Disimpan terenkripsi."
          >
            <input
              {...p("nik")}
              value={w.nik}
              onChange={ubah("nik")}
              inputMode="numeric"
              maxLength={16}
              minLength={16}
              pattern="[0-9]{16}"
              required
              autoComplete="off"
            />
          </Bidang>
          <Bidang
            id="wm-jenisKelamin"
            label="Jenis kelamin"
            wajib
            galat={g("jenisKelamin")}
          >
            <select
              {...p("jenisKelamin")}
              value={w.jenisKelamin}
              onChange={ubah("jenisKelamin")}
              required
            >
              <option value="">Pilih jenis kelamin</option>
              {JENIS_KELAMIN.map((j) => (
                <option key={j} value={j}>
                  {LABEL_JK[j]}
                </option>
              ))}
            </select>
          </Bidang>
          <Bidang
            id="wm-tempatLahir"
            label="Tempat lahir"
            wajib
            galat={g("tempatLahir")}
          >
            <input
              {...p("tempatLahir")}
              value={w.tempatLahir}
              onChange={ubah("tempatLahir")}
              maxLength={80}
              required
            />
          </Bidang>
          <Bidang
            id="wm-tanggalLahir"
            label="Tanggal lahir"
            galat={g("tanggalLahir")}
          >
            <input
              {...p("tanggalLahir")}
              type="date"
              value={w.tanggalLahir}
              max={hariIni()}
              onChange={ubah("tanggalLahir")}
            />
          </Bidang>
          <Bidang
            id="wm-hubungan"
            label="Hubungan dalam keluarga"
            wajib
            galat={g("hubungan")}
          >
            <select
              {...p("hubungan")}
              value={w.hubungan}
              onChange={ubah("hubungan")}
            >
              {HUBUNGAN.map((h) => (
                <option key={h} value={h}>
                  {LABEL_HUBUNGAN[h]}
                </option>
              ))}
            </select>
          </Bidang>
          <Bidang
            id="wm-noHp"
            label="Nomor HP"
            wajib
            galat={g("noHp")}
            bantuan="Contoh: 081234567890"
          >
            <input
              {...p("noHp")}
              type="tel"
              value={w.noHp}
              onChange={ubah("noHp")}
              required
            />
          </Bidang>
          <Bidang
            id="wm-pekerjaan"
            label="Pekerjaan"
            galat={g("pekerjaan")}
            className="sm:col-span-2"
          >
            <input
              {...p("pekerjaan")}
              value={w.pekerjaan}
              onChange={ubah("pekerjaan")}
              maxLength={80}
            />
          </Bidang>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-base font-bold text-hijau">
          3. Akun login (opsional)
        </legend>
        <p className="text-sm text-muted-fg">
          Isi bila warga ingin langsung bisa masuk ke portal. Boleh dikosongkan
          dan dibuat nanti dari halaman data warga.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Bidang
            id="wm-email"
            label="Email (untuk masuk)"
            galat={galat["email"]}
          >
            <input
              id="wm-email"
              type="email"
              value={akun.email}
              onChange={(e) =>
                setAkun((s) => ({ ...s, email: e.target.value }))
              }
              required={adaAkun}
              autoComplete="off"
              className={KELAS_ISIAN}
            />
          </Bidang>
          <Bidang
            id="wm-sandi"
            label="Sandi sementara"
            galat={galat["sandi"]}
            bantuan="Minimal 12 karakter. Sampaikan ke warga lewat jalur yang aman."
          >
            <input
              id="wm-sandi"
              type="text"
              value={akun.sandi}
              onChange={(e) =>
                setAkun((s) => ({ ...s, sandi: e.target.value }))
              }
              required={adaAkun}
              minLength={12}
              autoComplete="off"
              className={KELAS_ISIAN}
            />
          </Bidang>
        </div>
      </fieldset>

      <div>
        {dibuatId ? (
          <Link
            href={`/admin/warga/${dibuatId}`}
            className={`${TOMBOL_UTAMA} w-full sm:w-auto`}
          >
            Buka data warga
          </Link>
        ) : (
          <button
            type="submit"
            disabled={proses || !keluargaId}
            className={`${TOMBOL_UTAMA} w-full sm:w-auto`}
          >
            {proses && <Loader2 className="size-4 animate-spin" />}
            {proses ? "Menyimpan..." : "Tambah warga"}
          </button>
        )}
      </div>
    </form>
  );
}
