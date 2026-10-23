"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  UserCog,
  X,
} from "lucide-react";
import type { Role } from "@/lib/cms/sesi";
import { INFO_PERAN, PERAN, peranDari } from "@/lib/izin";
import {
  buatPengguna,
  hapusPengguna,
  ubahPeranPengguna,
  ubahSandiPengguna,
} from "@/lib/cms/aksi-pengguna";
import { DialogKonfirmasi } from "@/components/cms/dialog-konfirmasi";
import { cn } from "@/lib/utils";

export type BarisPengguna = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date | string;
};

const PERAN_INFO = {
  admin: { ...INFO_PERAN.admin, badgeKelas: INFO_PERAN.admin.kelas },
  bendahara: { ...INFO_PERAN.bendahara, badgeKelas: INFO_PERAN.bendahara.kelas },
  warga: { ...INFO_PERAN.warga, badgeKelas: INFO_PERAN.warga.kelas },
} satisfies Record<
  Role,
  { nama: string; badgeKelas: string; deskripsi: string }
>;

const ISIAN =
  "w-full rounded-lg border border-line-strong bg-background px-3 py-2 text-sm text-hijau-tua outline-none transition-colors placeholder:text-muted-fg/50 focus-visible:border-brand";
const LABEL = "block text-xs font-semibold uppercase tracking-wider text-muted-fg mb-1.5";

const peranValid = (r: string | null): Role => peranDari(r);

const formatTanggal = (d: Date | string) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export function PanelPengguna({
  daftar,
  sesiUserId,
}: {
  daftar: BarisPengguna[];
  sesiUserId: string;
}) {
  const router = useRouter();

  // Status & Transisi
  const [pesan, setPesan] = useState<{ teks: string; sukses: boolean } | null>(
    null,
  );
  const [galatForm, setGalatForm] = useState<Record<string, string>>({});
  const [sedangJalan, mulaiTransisi] = useTransition();

  // Modal State
  const [bukaTambah, setBukaTambah] = useState(false);
  const [targetUbahPeran, setTargetUbahPeran] = useState<BarisPengguna | null>(
    null,
  );
  const [targetUbahSandi, setTargetUbahSandi] = useState<BarisPengguna | null>(
    null,
  );
  const [targetHapus, setTargetHapus] = useState<BarisPengguna | null>(null);

  // Form State: Tambah
  const [formTambah, setFormTambah] = useState({
    nama: "",
    email: "",
    sandi: "",
    role: "warga" as Role,
  });
  const [lihatSandiTambah, setLihatSandiTambah] = useState(false);

  // Form State: Ubah Peran
  const [peranDipilih, setPeranDipilih] = useState<Role>("warga");

  // Form State: Ubah Sandi
  const [sandiBaru, setSandiBaru] = useState("");
  const [konfirmasiSandi, setKonfirmasiSandi] = useState("");
  const [lihatSandiBaru, setLihatSandiBaru] = useState(false);

  // Modal Refs
  const refModalTambah = useRef<HTMLDialogElement>(null);
  const refModalUbahPeran = useRef<HTMLDialogElement>(null);
  const refModalUbahSandi = useRef<HTMLDialogElement>(null);

  // Sinkronisasi Modal Tambah
  useEffect(() => {
    const d = refModalTambah.current;
    if (!d) return;
    if (bukaTambah && !d.open) d.showModal();
    if (!bukaTambah && d.open) d.close();
  }, [bukaTambah]);

  // Sinkronisasi Modal Ubah Peran
  useEffect(() => {
    const d = refModalUbahPeran.current;
    if (!d) return;
    if (targetUbahPeran && !d.open) {
      setPeranDipilih(peranValid(targetUbahPeran.role));
      d.showModal();
    }
    if (!targetUbahPeran && d.open) d.close();
  }, [targetUbahPeran]);

  // Sinkronisasi Modal Ubah Sandi
  useEffect(() => {
    const d = refModalUbahSandi.current;
    if (!d) return;
    if (targetUbahSandi && !d.open) {
      setSandiBaru("");
      setKonfirmasiSandi("");
      setGalatForm({});
      d.showModal();
    }
    if (!targetUbahSandi && d.open) d.close();
  }, [targetUbahSandi]);

  // Aksi: Buat Pengguna
  const handleBuatPengguna = () => {
    setGalatForm({});
    setPesan(null);

    mulaiTransisi(async () => {
      const res = await buatPengguna(formTambah);
      if (!res.ok) {
        setPesan({ teks: res.pesan, sukses: false });
        if (res.galat) setGalatForm(res.galat);
        return;
      }

      setPesan({
        teks: `Pengguna ${formTambah.email} berhasil ditambahkan.`,
        sukses: true,
      });
      setFormTambah({ nama: "", email: "", sandi: "", role: "warga" });
      setBukaTambah(false);
      router.refresh();
    });
  };

  // Aksi: Ubah Peran
  const handleUbahPeran = () => {
    if (!targetUbahPeran) return;
    setGalatForm({});
    setPesan(null);

    mulaiTransisi(async () => {
      const res = await ubahPeranPengguna(targetUbahPeran.id, {
        role: peranDipilih,
      });
      if (!res.ok) {
        setPesan({ teks: res.pesan, sukses: false });
        return;
      }

      setPesan({
        teks: `Peran ${targetUbahPeran.name} berhasil diubah menjadi ${PERAN_INFO[peranDipilih].nama}.`,
        sukses: true,
      });
      setTargetUbahPeran(null);
      router.refresh();
    });
  };

  // Aksi: Ubah Sandi
  const handleUbahSandi = () => {
    if (!targetUbahSandi) return;
    setGalatForm({});
    setPesan(null);

    if (sandiBaru.length < 12) {
      setGalatForm({ sandi: "Sandi minimal 12 karakter." });
      return;
    }
    if (sandiBaru !== konfirmasiSandi) {
      setGalatForm({
        konfirmasi: "Konfirmasi sandi tidak sesuai dengan sandi baru.",
      });
      return;
    }

    mulaiTransisi(async () => {
      const res = await ubahSandiPengguna(targetUbahSandi.id, {
        sandi: sandiBaru,
      });
      if (!res.ok) {
        setPesan({ teks: res.pesan, sukses: false });
        if (res.galat) setGalatForm(res.galat);
        return;
      }

      setPesan({
        teks: `Kata sandi untuk ${targetUbahSandi.name} berhasil diperbarui.`,
        sukses: true,
      });
      setTargetUbahSandi(null);
      router.refresh();
    });
  };

  // Aksi: Hapus Pengguna
  const handleHapusPengguna = () => {
    if (!targetHapus) return;
    setGalatForm({});
    setPesan(null);

    mulaiTransisi(async () => {
      const res = await hapusPengguna(targetHapus.id);
      if (!res.ok) {
        setPesan({ teks: res.pesan, sukses: false });
        setTargetHapus(null);
        return;
      }

      setPesan({
        teks: `Pengguna ${targetHapus.name} telah berhasil dihapus.`,
        sukses: true,
      });
      setTargetHapus(null);
      router.refresh();
    });
  };

  return (
    <div className="max-w-5xl">
      {/* Header & Tombol Tambah */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-hijau-tua">
            Manajemen Pengguna
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-fg">
            Kelola akses pengguna dan tetapkan peran sesuai kewenangan:
            Admin, Bendahara, atau Warga.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setGalatForm({});
            setPesan(null);
            setBukaTambah(true);
          }}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-background transition-colors hover:bg-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Plus className="size-4" />
          Tambah Pengguna
        </button>
      </div>

      {/* Notifikasi Banner */}
      {pesan && (
        <div
          role="alert"
          className={cn(
            "mt-6 flex items-start justify-between gap-3 rounded-lg border p-3.5 text-sm transition-all",
            pesan.sukses
              ? "border-hijau/30 bg-hijau/10 text-hijau"
              : "border-red-500/30 bg-red-500/10 text-red-700",
          )}
        >
          <div className="flex items-start gap-2.5">
            {pesan.sukses ? (
              <Check className="mt-0.5 size-4 shrink-0 text-hijau" />
            ) : (
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-700" />
            )}
            <span>{pesan.teks}</span>
          </div>
          <button
            type="button"
            onClick={() => setPesan(null)}
            className="text-muted-fg hover:text-hijau-tua"
            aria-label="Tutup pemberitahuan"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Tabel Pengguna */}
      <div className="mt-8 overflow-hidden rounded-xl border border-line bg-surface/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface/80 text-xs font-semibold uppercase tracking-wider text-muted-fg">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Pengguna
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Peran
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Terdaftar
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {daftar.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-muted-fg"
                  >
                    Belum ada akun pengguna yang terdaftar.
                  </td>
                </tr>
              ) : (
                daftar.map((p) => {
                  const peran = peranValid(p.role);
                  const info = PERAN_INFO[peran];
                  const adalahDiriSendiri = p.id === sesiUserId;

                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-hijau/[0.06]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-sm font-semibold uppercase text-brand">
                            {p.name.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-hijau-tua truncate max-w-xs">
                                {p.name}
                              </span>
                              {adalahDiriSendiri && (
                                <span className="rounded bg-hijau/[0.08] px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-fg">
                              {p.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                            info.badgeKelas,
                          )}
                        >
                          <span className="size-1.5 rounded-full bg-current opacity-70" />
                          {info.nama}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-xs text-muted-fg whitespace-nowrap">
                        {formatTanggal(p.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setTargetUbahPeran(p)}
                            title="Ubah peran pengguna"
                            className="grid size-8 place-items-center rounded-lg border border-transparent text-muted-fg transition-colors hover:border-line-strong hover:bg-hijau/[0.06] hover:text-hijau-tua"
                          >
                            <Shield className="size-4" />
                            <span className="sr-only">Ubah peran {p.name}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetUbahSandi(p)}
                            title="Ubah kata sandi"
                            className="grid size-8 place-items-center rounded-lg border border-transparent text-muted-fg transition-colors hover:border-line-strong hover:bg-hijau/[0.06] hover:text-hijau-tua"
                          >
                            <KeyRound className="size-4" />
                            <span className="sr-only">
                              Ubah sandi {p.name}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setTargetHapus(p)}
                            disabled={adalahDiriSendiri}
                            title={
                              adalahDiriSendiri
                                ? "Anda tidak dapat menghapus akun Anda sendiri"
                                : "Hapus akun pengguna"
                            }
                            className={cn(
                              "grid size-8 place-items-center rounded-lg border border-transparent text-muted-fg transition-colors",
                              adalahDiriSendiri
                                ? "cursor-not-allowed opacity-30"
                                : "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-700",
                            )}
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Hapus {p.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================
          MODAL 1: Tambah Pengguna Baru
         =================================================================== */}
      <dialog
        ref={refModalTambah}
        onCancel={(e) => {
          e.preventDefault();
          if (!sedangJalan) setBukaTambah(false);
        }}
        onClick={(e) => {
          if (e.target === refModalTambah.current && !sedangJalan) {
            setBukaTambah(false);
          }
        }}
        className="m-auto w-[min(34rem,calc(100vw-2.5rem))] rounded-2xl border border-line-strong bg-surface p-0 text-hijau-tua backdrop:bg-background/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-brand/10 text-brand">
                <UserCog className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Tambah Pengguna Baru</h2>
                <p className="text-xs text-muted-fg mt-0.5">
                  Akun dapat langsung digunakan untuk masuk ke panel.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sedangJalan && setBukaTambah(false)}
              className="rounded-lg p-1 text-muted-fg hover:bg-hijau/[0.06] hover:text-hijau-tua"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="tambah-nama" className={LABEL}>
                Nama Lengkap
              </label>
              <input
                id="tambah-nama"
                type="text"
                value={formTambah.nama}
                onChange={(e) =>
                  setFormTambah((f) => ({ ...f, nama: e.target.value }))
                }
                placeholder="misal: Budi Santoso"
                className={ISIAN}
              />
              {galatForm.nama && (
                <p className="mt-1 text-xs text-red-700">{galatForm.nama}</p>
              )}
            </div>

            <div>
              <label htmlFor="tambah-email" className={LABEL}>
                Alamat Email
              </label>
              <input
                id="tambah-email"
                type="email"
                value={formTambah.email}
                onChange={(e) =>
                  setFormTambah((f) => ({ ...f, email: e.target.value }))
                }
                placeholder="nama@bersamateknologiunggul.id"
                className={ISIAN}
              />
              {galatForm.email && (
                <p className="mt-1 text-xs text-red-700">{galatForm.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="tambah-sandi" className={LABEL}>
                Kata Sandi (Min. 12 Karakter)
              </label>
              <div className="relative">
                <input
                  id="tambah-sandi"
                  type={lihatSandiTambah ? "text" : "password"}
                  value={formTambah.sandi}
                  onChange={(e) =>
                    setFormTambah((f) => ({ ...f, sandi: e.target.value }))
                  }
                  placeholder="Kombinasi huruf, angka, dan simbol"
                  className={cn(ISIAN, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setLihatSandiTambah((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-hijau-tua"
                  aria-label={lihatSandiTambah ? "Sembunyikan sandi" : "Lihat sandi"}
                >
                  {lihatSandiTambah ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {galatForm.sandi && (
                <p className="mt-1 text-xs text-red-700">{galatForm.sandi}</p>
              )}
            </div>

            <div>
              <label className={LABEL}>Peran & Hak Akses</label>
              <div className="space-y-2">
                {(PERAN as readonly Role[]).map((r) => {
                  const info = PERAN_INFO[r];
                  const terpilih = formTambah.role === r;

                  return (
                    <label
                      key={r}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                        terpilih
                          ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                          : "border-line bg-surface/40 hover:border-line-strong hover:bg-surface/80",
                      )}
                    >
                      <input
                        type="radio"
                        name="tambah-role"
                        value={r}
                        checked={terpilih}
                        onChange={() =>
                          setFormTambah((f) => ({ ...f, role: r }))
                        }
                        className="mt-1 size-4 accent-[#1f5f4a]"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-hijau-tua">
                            {info.nama}
                          </span>
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-[10px] font-medium border",
                              info.badgeKelas,
                            )}
                          >
                            {r}
                          </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-fg">
                          {info.deskripsi}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setBukaTambah(false)}
              disabled={sedangJalan}
              className="h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-muted-fg transition-colors hover:bg-hijau/[0.06] hover:text-hijau-tua disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleBuatPengguna}
              disabled={
                sedangJalan ||
                !formTambah.nama ||
                !formTambah.email ||
                formTambah.sandi.length < 12
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-background transition-colors hover:bg-brand-bright disabled:opacity-50"
            >
              {sedangJalan ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Membuat Akun...</span>
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  <span>Simpan Pengguna</span>
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>

      {/* ===================================================================
          MODAL 2: Ubah Peran
         =================================================================== */}
      <dialog
        ref={refModalUbahPeran}
        onCancel={(e) => {
          e.preventDefault();
          if (!sedangJalan) setTargetUbahPeran(null);
        }}
        onClick={(e) => {
          if (e.target === refModalUbahPeran.current && !sedangJalan) {
            setTargetUbahPeran(null);
          }
        }}
        className="m-auto w-[min(34rem,calc(100vw-2.5rem))] rounded-2xl border border-line-strong bg-surface p-0 text-hijau-tua backdrop:bg-background/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-blue-500/10 text-blue-800">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Ubah Peran Pengguna</h2>
                <p className="text-xs text-muted-fg mt-0.5">
                  {targetUbahPeran?.name} ({targetUbahPeran?.email})
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sedangJalan && setTargetUbahPeran(null)}
              className="rounded-lg p-1 text-muted-fg hover:bg-hijau/[0.06] hover:text-hijau-tua"
            >
              <X className="size-4" />
            </button>
          </div>

          {targetUbahPeran?.id === sesiUserId && (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-800" />
              <span>
                <strong>Perhatian:</strong> Anda sedang mengubah peran akun Anda
                sendiri. Pastikan setidaknya masih ada satu Admin lain bila
                Anda menurunkan peran ini.
              </span>
            </div>
          )}

          <div className="mt-6 space-y-2.5">
            {(PERAN as readonly Role[]).map((r) => {
              const info = PERAN_INFO[r];
              const terpilih = peranDipilih === r;

              return (
                <label
                  key={r}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors",
                    terpilih
                      ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                      : "border-line bg-surface/40 hover:border-line-strong hover:bg-surface/80",
                  )}
                >
                  <input
                    type="radio"
                    name="ubah-role"
                    value={r}
                    checked={terpilih}
                    onChange={() => setPeranDipilih(r)}
                    className="mt-1 size-4 accent-[#1f5f4a]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-hijau-tua">
                        {info.nama}
                      </span>
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-medium border",
                          info.badgeKelas,
                        )}
                      >
                        {r}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-fg">
                      {info.deskripsi}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setTargetUbahPeran(null)}
              disabled={sedangJalan}
              className="h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-muted-fg transition-colors hover:bg-hijau/[0.06] hover:text-hijau-tua disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUbahPeran}
              disabled={sedangJalan}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-background transition-colors hover:bg-brand-bright disabled:opacity-50"
            >
              {sedangJalan ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  <span>Simpan Peran</span>
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>

      {/* ===================================================================
          MODAL 3: Ubah Kata Sandi
         =================================================================== */}
      <dialog
        ref={refModalUbahSandi}
        onCancel={(e) => {
          e.preventDefault();
          if (!sedangJalan) setTargetUbahSandi(null);
        }}
        onClick={(e) => {
          if (e.target === refModalUbahSandi.current && !sedangJalan) {
            setTargetUbahSandi(null);
          }
        }}
        className="m-auto w-[min(32rem,calc(100vw-2.5rem))] rounded-2xl border border-line-strong bg-surface p-0 text-hijau-tua backdrop:bg-background/70 backdrop:backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-amber-500/10 text-amber-800">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Ubah Kata Sandi</h2>
                <p className="text-xs text-muted-fg mt-0.5">
                  Setel ulang kata sandi {targetUbahSandi?.name}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !sedangJalan && setTargetUbahSandi(null)}
              className="rounded-lg p-1 text-muted-fg hover:bg-hijau/[0.06] hover:text-hijau-tua"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="sandi-baru" className={LABEL}>
                Kata Sandi Baru (Min. 12 Karakter)
              </label>
              <div className="relative">
                <input
                  id="sandi-baru"
                  type={lihatSandiBaru ? "text" : "password"}
                  value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)}
                  placeholder="Ketik kata sandi baru"
                  className={cn(ISIAN, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => setLihatSandiBaru((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-fg hover:text-hijau-tua"
                  aria-label={lihatSandiBaru ? "Sembunyikan sandi" : "Lihat sandi"}
                >
                  {lihatSandiBaru ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {galatForm.sandi && (
                <p className="mt-1 text-xs text-red-700">{galatForm.sandi}</p>
              )}
            </div>

            <div>
              <label htmlFor="konfirmasi-sandi" className={LABEL}>
                Ulangi Kata Sandi Baru
              </label>
              <input
                id="konfirmasi-sandi"
                type="password"
                value={konfirmasiSandi}
                onChange={(e) => setKonfirmasiSandi(e.target.value)}
                placeholder="Ulangi kata sandi di atas"
                className={ISIAN}
              />
              {galatForm.konfirmasi && (
                <p className="mt-1 text-xs text-red-700">
                  {galatForm.konfirmasi}
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setTargetUbahSandi(null)}
              disabled={sedangJalan}
              className="h-10 rounded-lg border border-line-strong px-4 text-sm font-medium text-muted-fg transition-colors hover:bg-hijau/[0.06] hover:text-hijau-tua disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUbahSandi}
              disabled={
                sedangJalan ||
                sandiBaru.length < 12 ||
                sandiBaru !== konfirmasiSandi
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-background transition-colors hover:bg-brand-bright disabled:opacity-50"
            >
              {sedangJalan ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  <span>Simpan Sandi Baru</span>
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>

      {/* ===================================================================
          MODAL 4: Konfirmasi Hapus Pengguna
         =================================================================== */}
      <DialogKonfirmasi
        terbuka={Boolean(targetHapus)}
        judul="Hapus pengguna?"
        keterangan={`Akun ${targetHapus?.name} (${targetHapus?.email}) akan dihapus secara permanen. Pengguna ini tidak akan dapat masuk kembali ke sistem.`}
        labelYa="Hapus Pengguna"
        sedangProses={sedangJalan}
        onYa={handleHapusPengguna}
        onBatal={() => setTargetHapus(null)}
      />
    </div>
  );
}
