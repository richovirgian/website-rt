/**
 * Templat surat dan isian otomatisnya.
 *
 * Templat memakai penanda {{nama}}. Hanya penanda di PLACEHOLDER yang
 * diterima saat templat disimpan, supaya salah ketik ({{namma}}) ketahuan
 * saat itu juga dan tidak baru muncul di surat yang sudah dicetak.
 */
export const PLACEHOLDER = {
  nama: "Nama lengkap pemohon",
  nik: "NIK pemohon (hanya tampil saat surat dicetak)",
  rumah: "Kode rumah, contoh G-12",
  alamat: "Alamat rumah, atau kode rumah bila alamat kosong",
  keperluan: "Keperluan yang diisi pemohon",
  tanggal: "Tanggal surat disetujui",
  nomor: "Nomor surat",
  rt: "Nama RT",
  wilayah: "Wilayah RT (dari Pengaturan RT)",
} as const;
export type NamaPlaceholder = keyof typeof PLACEHOLDER;

const POLA = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

/** Daftar penanda yang tidak dikenal. Kosong berarti templat sah. */
export function placeholderTakDikenal(templat: string): string[] {
  const tak = new Set<string>();
  for (const m of templat.matchAll(POLA)) {
    if (!(m[1]! in PLACEHOLDER)) tak.add(m[1]!);
  }
  return [...tak];
}

export const pakaiNik = (templat: string) => /\{\{\s*nik\s*\}\}/.test(templat);

export function renderSurat(templat: string, data: Partial<Record<NamaPlaceholder, string>>): string {
  return templat.replace(POLA, (_, k: string) => data[k as NamaPlaceholder] ?? "");
}

export const TEMPLAT_PENGANTAR = `Yang bertanda tangan di bawah ini, Ketua {{rt}} ({{wilayah}}), menerangkan bahwa:

Nama      : {{nama}}
NIK       : {{nik}}
Alamat    : {{alamat}}

adalah benar warga kami yang berdomisili di alamat tersebut.

Surat pengantar ini dibuat untuk keperluan: {{keperluan}}.

Demikian surat pengantar ini dibuat untuk dapat dipergunakan sebagaimana mestinya.`;

export const TEMPLAT_DOMISILI = `Yang bertanda tangan di bawah ini, Ketua {{rt}} ({{wilayah}}), menerangkan bahwa:

Nama      : {{nama}}
NIK       : {{nik}}
Alamat    : {{alamat}}

benar bertempat tinggal di lingkungan kami pada alamat tersebut.

Surat keterangan ini diberikan untuk keperluan: {{keperluan}}.

Demikian surat keterangan ini dibuat dengan sebenarnya.`;

export const JENIS_SURAT_BAWAAN = [
  { nama: "Surat Pengantar RT", kode: "SPN", deskripsi: "Pengantar untuk berbagai keperluan administrasi.", templat: TEMPLAT_PENGANTAR },
  { nama: "Surat Keterangan Domisili", kode: "SKD", deskripsi: "Menyatakan warga berdomisili di lingkungan RT.", templat: TEMPLAT_DOMISILI },
] as const;
