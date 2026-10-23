/**
 * Artikel contoh. Ganti, tambah, atau hapus langsung di sini. Urutan tampil
 * mengikuti tanggal (terbaru dulu). `slug` menjadi alamat halaman.
 */
export type Artikel = {
  slug: string;
  judul: string;
  kategori: "Kegiatan" | "Keamanan" | "Keuangan" | "Lingkungan" | "Pengumuman";
  tanggal: string; // YYYY-MM-DD
  penulis: string;
  ringkas: string;
  isi: { judul?: string; paragraf: string[] }[];
  /** Alamat gambar sampul (hanya untuk artikel dari database). */
  cover?: string | null;
};

const SEMUA: Artikel[] = [
  {
    slug: "selamat-datang-di-situs-warga",
    judul: "Selamat datang di situs resmi warga",
    kategori: "Pengumuman",
    tanggal: "2026-10-20",
    penulis: "Pengurus RT",
    ringkas:
      "Situs ini hadir sebagai rumah digital warga: tempat mengenal lingkungan, membaca kabar, dan mengikuti kegiatan.",
    isi: [
      {
        paragraf: [
          "Setelah lama mengandalkan papan pengumuman dan grup pesan, pengurus memutuskan membuat satu tempat yang rapi untuk semua informasi lingkungan.",
          "Di situs ini Anda bisa mengenal pengurus dan sejarah lingkungan, membaca artikel, melihat agenda kegiatan, dan menengok galeri dokumentasi.",
        ],
      },
      {
        judul: "Apa yang akan hadir berikutnya",
        paragraf: [
          "Warga yang sudah memiliki akun dari pengurus dapat masuk ke portal warga. Layanan di dalamnya dibuka bertahap, dan pengurus akan mengumumkannya di sini.",
          "Masukan dari warga sangat kami harapkan. Sampaikan lewat pengurus atau pada rapat warga bulanan.",
        ],
      },
    ],
  },
  {
    slug: "memahami-iuran-warga",
    judul: "Memahami iuran warga: untuk apa dan ke mana dananya",
    kategori: "Keuangan",
    tanggal: "2026-10-12",
    penulis: "Bendahara",
    ringkas:
      "Iuran bukan sekadar kewajiban. Ini penjelasan sederhana tentang pos-pos yang dibiayai dan cara kami melaporkannya.",
    isi: [
      {
        paragraf: [
          "Iuran warga dikumpulkan untuk membiayai kebutuhan bersama yang tidak mungkin ditanggung satu rumah: keamanan, kebersihan, dan perawatan fasilitas.",
        ],
      },
      {
        judul: "Pos yang dibiayai",
        paragraf: [
          "Honor petugas kebersihan, listrik penerangan jalan dan pos ronda, perawatan saluran air dan taman, serta dana sosial untuk warga yang membutuhkan.",
        ],
      },
      {
        judul: "Bagaimana dilaporkan",
        paragraf: [
          "Bendahara menyampaikan laporan pemasukan dan pengeluaran dalam rapat warga bulanan. Warga berhak bertanya dan meminta rincian kapan saja.",
        ],
      },
    ],
  },
  {
    slug: "jadwal-dan-tata-cara-ronda",
    judul: "Jadwal dan tata cara ronda malam",
    kategori: "Keamanan",
    tanggal: "2026-10-05",
    penulis: "Seksi Keamanan",
    ringkas:
      "Ronda berjalan baik karena semua warga ikut bergiliran. Berikut aturan main yang kami sepakati bersama.",
    isi: [
      {
        paragraf: [
          "Ronda dilakukan berkelompok dan bergiliran sehingga beban terbagi adil. Setiap kelompok bertugas pada malam yang sudah dijadwalkan.",
        ],
      },
      {
        judul: "Tata cara singkat",
        paragraf: [
          "Berkumpul di pos ronda pukul 22.00. Berkeliling lingkungan minimal dua kali, dan mencatat hal yang perlu ditindaklanjuti. Warga yang berhalangan wajib menukar giliran dengan tetangga atau mengabari seksi keamanan.",
        ],
      },
    ],
  },
  {
    slug: "kerja-bakti-bulanan",
    judul: "Kerja bakti bulanan: lingkungan bersih, warga guyub",
    kategori: "Kegiatan",
    tanggal: "2026-10-04",
    penulis: "Seksi Kebersihan",
    ringkas:
      "Satu pagi setiap bulan untuk membersihkan lingkungan, sekaligus menyapa tetangga yang jarang bertemu.",
    isi: [
      {
        paragraf: [
          "Kerja bakti dilakukan setiap Minggu pertama. Selain membersihkan jalan dan saluran, momen ini menjadi ajang bertukar kabar antarwarga.",
          "Anak-anak pun dilibatkan sesuai kemampuan, agar kebiasaan menjaga lingkungan tumbuh sejak kecil.",
        ],
      },
    ],
  },
  {
    slug: "tips-lingkungan-bebas-genangan",
    judul: "Tips menjaga lingkungan bebas genangan di musim hujan",
    kategori: "Lingkungan",
    tanggal: "2026-09-28",
    penulis: "Seksi Kebersihan",
    ringkas:
      "Genangan sering bermula dari saluran yang tersumbat sampah kecil. Beberapa kebiasaan sederhana bisa mencegahnya.",
    isi: [
      {
        paragraf: [
          "Sebelum hujan deras datang, pastikan saluran di depan rumah bebas dari daun, plastik, dan sisa bangunan.",
        ],
      },
      {
        judul: "Kebiasaan yang membantu",
        paragraf: [
          "Jangan membuang sampah ke saluran, bersihkan saluran depan rumah seminggu sekali, dan laporkan genangan yang tidak surut kepada seksi kebersihan.",
        ],
      },
    ],
  },
];

export const KATEGORI = [
  "Kegiatan",
  "Keamanan",
  "Keuangan",
  "Lingkungan",
  "Pengumuman",
] as const;

export const semuaArtikel = (): Artikel[] =>
  [...SEMUA].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

export const artikelBySlug = (slug: string): Artikel | undefined =>
  SEMUA.find((a) => a.slug === slug);

/** Perkiraan menit baca, dengan kecepatan 200 kata per menit. */
export const menitBaca = (a: Artikel): number => {
  const kata = a.isi
    .flatMap((b) => [b.judul ?? "", ...b.paragraf])
    .join(" ")
    .split(/\s+/).length;
  return Math.max(1, Math.round(kata / 200));
};
