import {
  Camera,
  CalendarDays,
  FileText,
  Flower2,
  HandHeart,
  Handshake,
  Landmark,
  Megaphone,
  MessageSquareWarning,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Trees,
  Trophy,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Isi situs profil RT. Satu-satunya tempat yang perlu diedit untuk mengganti
 * teks, angka, nama pengurus, agenda, dan galeri.
 *
 * PERHATIAN: isi di bawah ini masih contoh tulisan (nama pengurus, tahun,
 * angka, dan agenda hanya ilustrasi). Ganti dengan data RT yang sebenarnya
 * sebelum situs dipublikasikan.
 */

/* ------------------------------------------------------------- Beranda --- */

export const SLOGAN = "Rukun, aman, dan guyub dalam satu lingkungan.";

export const SAMBUTAN = [
  "Selamat datang di rumah digital kami. Di sini warga dan siapa pun yang berkunjung bisa mengenal lingkungan kami: siapa pengurusnya, apa saja kegiatannya, dan bagaimana kami menjaga kebersamaan sehari-hari.",
  "Kami percaya lingkungan yang baik dibangun dari hal-hal kecil yang dikerjakan bersama: menyapa tetangga, menjaga kebersihan, bergiliran ronda, dan terbuka soal pengelolaan iuran.",
];

export const STATISTIK: { label: string; nilai: number; akhiran?: string }[] = [
  { label: "Kepala keluarga", nilai: 86 },
  { label: "Jiwa warga", nilai: 312 },
  { label: "Kegiatan per tahun", nilai: 24, akhiran: "+" },
  { label: "Tahun berdiri", nilai: 2009 },
];

export const NILAI: { ikon: LucideIcon; judul: string; isi: string }[] = [
  {
    ikon: Handshake,
    judul: "Gotong royong",
    isi: "Kerja bakti, ronda, dan hajatan warga dikerjakan bersama, bukan dibebankan pada segelintir orang.",
  },
  {
    ikon: ShieldCheck,
    judul: "Aman dan nyaman",
    isi: "Ronda terjadwal, penerangan jalan terjaga, dan warga saling memperhatikan tamu serta lingkungan sekitar.",
  },
  {
    ikon: Landmark,
    judul: "Transparan",
    isi: "Pemasukan dan pengeluaran iuran dilaporkan terbuka kepada warga secara berkala.",
  },
  {
    ikon: Flower2,
    judul: "Bersih dan asri",
    isi: "Lingkungan yang rapi, saluran air lancar, dan taman yang dirawat bersama.",
  },
];

/* --------------------------------------------------------------- Profil --- */

export const PROFIL_PARAGRAF = [
  "Kami adalah warga satu lingkungan yang hidup berdampingan sebagai satu keluarga besar. Rukun Tetangga ini lahir dari kebutuhan sederhana: memastikan setiap warga merasa aman, terbantu, dan didengar.",
  "Pengurus dipilih oleh warga melalui musyawarah, dan bekerja secara sukarela. Setiap keputusan penting dibahas dalam rapat warga, dan hasilnya disampaikan kepada seluruh penghuni.",
];

export const VISI =
  "Terwujudnya lingkungan yang rukun, aman, bersih, dan terbuka, tempat setiap warga merasa memiliki dan ikut menjaga.";

export const MISI = [
  "Mempererat silaturahmi lewat kegiatan rutin yang melibatkan semua usia.",
  "Menjaga keamanan lingkungan melalui ronda terjadwal dan kewaspadaan bersama.",
  "Mengelola iuran secara jujur, tertib, dan dilaporkan terbuka.",
  "Merawat kebersihan dan keasrian lingkungan lewat kerja bakti dan kebiasaan baik.",
  "Melayani kebutuhan administrasi warga dengan cepat dan ramah.",
];

export const SEJARAH: { tahun: string; judul: string; isi: string }[] = [
  {
    tahun: "2009",
    judul: "Lingkungan terbentuk",
    isi: "Penghuni pertama mulai menempati blok ini dan sepakat membentuk wadah kebersamaan.",
  },
  {
    tahun: "2012",
    judul: "Pengurus pertama dipilih",
    isi: "Warga memilih pengurus lewat musyawarah dan menyusun aturan lingkungan yang disepakati bersama.",
  },
  {
    tahun: "2016",
    judul: "Pos ronda dan penerangan jalan",
    isi: "Pos ronda berdiri dan jadwal ronda tertata. Penerangan jalan dilengkapi dari iuran warga.",
  },
  {
    tahun: "2020",
    judul: "Saling jaga di masa sulit",
    isi: "Warga bahu-membahu membantu tetangga yang terdampak, dari belanja kebutuhan sampai berbagi bahan pokok.",
  },
  {
    tahun: "2025",
    judul: "Beralih ke pencatatan digital",
    isi: "Data warga, iuran, dan informasi lingkungan mulai dikelola lewat situs ini agar lebih rapi dan terbuka.",
  },
];

export const WILAYAH = {
  deskripsi:
    "Lingkungan kami berada di satu blok perumahan dengan satu jalan utama dan beberapa gang penghubung. Seluruh rumah dapat dijangkau kendaraan roda empat.",
  batas: [
    { arah: "Utara", ket: "Jalan lingkungan utama" },
    { arah: "Selatan", ket: "Saluran drainase dan blok sebelah" },
    { arah: "Timur", ket: "Taman dan lapangan bersama" },
    { arah: "Barat", ket: "Pagar pembatas kompleks" },
  ],
};

export const FASILITAS: { ikon: LucideIcon; judul: string; isi: string }[] = [
  { ikon: ShieldCheck, judul: "Pos ronda", isi: "Pusat jaga malam dan titik kumpul keamanan." },
  { ikon: Trees, judul: "Taman bermain", isi: "Ruang bermain anak dan tempat bersantai sore hari." },
  { ikon: Landmark, judul: "Musala", isi: "Tempat ibadah dan kegiatan keagamaan warga." },
  { ikon: Trophy, judul: "Lapangan serbaguna", isi: "Olahraga, senam pagi, dan acara warga." },
  { ikon: HandHeart, judul: "Ruang pertemuan", isi: "Rapat warga, arisan, dan pelatihan." },
  { ikon: Sparkles, judul: "Penerangan jalan", isi: "Lampu jalan di seluruh ruas lingkungan." },
];

/* -------------------------------------------------------------- Struktur --- */

export type Pengurus = {
  jabatan: string;
  nama: string;
  tugas: string;
};

export const KETUA: Pengurus = {
  jabatan: "Ketua RT",
  nama: "Nama Ketua RT",
  tugas: "Memimpin pengurus, memimpin rapat, dan mewakili warga.",
};

export const INTI: Pengurus[] = [
  {
    jabatan: "Wakil Ketua",
    nama: "Nama Wakil Ketua",
    tugas: "Mendampingi ketua dan menggantikan bila berhalangan.",
  },
  {
    jabatan: "Sekretaris",
    nama: "Nama Sekretaris",
    tugas: "Surat-menyurat, pencatatan rapat, dan data warga.",
  },
  {
    jabatan: "Bendahara",
    nama: "Nama Bendahara",
    tugas: "Mengelola iuran dan menyusun laporan keuangan.",
  },
];

export const SEKSI: Pengurus[] = [
  {
    jabatan: "Seksi Keamanan",
    nama: "Nama Koordinator",
    tugas: "Jadwal ronda dan koordinasi keamanan lingkungan.",
  },
  {
    jabatan: "Seksi Kebersihan",
    nama: "Nama Koordinator",
    tugas: "Kerja bakti, pengelolaan sampah, dan saluran air.",
  },
  {
    jabatan: "Seksi Sosial",
    nama: "Nama Koordinator",
    tugas: "Kepedulian sosial, takziah, dan bantuan antarwarga.",
  },
  {
    jabatan: "Seksi Humas",
    nama: "Nama Koordinator",
    tugas: "Informasi, dokumentasi, dan hubungan dengan pihak luar.",
  },
];

/* -------------------------------------------------------------- Kegiatan --- */

export const KEGIATAN_RUTIN: {
  ikon: LucideIcon;
  judul: string;
  waktu: string;
  isi: string;
}[] = [
  {
    ikon: Sparkles,
    judul: "Kerja bakti",
    waktu: "Setiap Minggu pertama, pagi",
    isi: "Membersihkan jalan, saluran air, dan taman bersama-sama.",
  },
  {
    ikon: ShieldCheck,
    judul: "Ronda malam",
    waktu: "Setiap malam, giliran per kelompok",
    isi: "Warga bergantian berjaga sesuai jadwal yang disepakati.",
  },
  {
    ikon: HandHeart,
    judul: "Arisan dan silaturahmi",
    waktu: "Sebulan sekali",
    isi: "Berkumpul, berbagi kabar, dan mempererat hubungan antarkeluarga.",
  },
  {
    ikon: Trophy,
    judul: "Senam pagi",
    waktu: "Setiap Minggu, 06.00",
    isi: "Olahraga ringan bersama di lapangan lingkungan.",
  },
];

export type Agenda = {
  tanggal: string; // YYYY-MM-DD
  judul: string;
  waktu: string;
  tempat: string;
  isi: string;
};

export const AGENDA: Agenda[] = [
  {
    tanggal: "2026-11-08",
    judul: "Kerja bakti akhir musim kemarau",
    waktu: "06.30 – 09.00 WIB",
    tempat: "Seluruh ruas jalan lingkungan",
    isi: "Membersihkan saluran air dan merapikan taman menjelang musim hujan. Mohon membawa peralatan masing-masing.",
  },
  {
    tanggal: "2026-11-22",
    judul: "Rapat warga bulanan",
    waktu: "19.30 WIB",
    tempat: "Ruang pertemuan",
    isi: "Laporan keuangan, jadwal ronda bulan depan, dan usulan warga.",
  },
  {
    tanggal: "2026-12-13",
    judul: "Pentas seni dan syukuran akhir tahun",
    waktu: "16.00 WIB",
    tempat: "Lapangan serbaguna",
    isi: "Penampilan anak-anak, lomba ringan, dan makan bersama.",
  },
];

/* ---------------------------------------------------------------- Galeri --- */

export type FotoGaleri = {
  judul: string;
  keterangan: string;
  /** Jalur gambar di folder public, contoh "/galeri/kerja-bakti.jpg". */
  foto?: string;
  ikon: LucideIcon;
  /** Kelas latar bila belum ada foto. */
  latar: string;
};

export const GALERI: FotoGaleri[] = [
  { judul: "Kerja bakti", keterangan: "Warga membersihkan saluran bersama.", ikon: Sparkles, latar: "from-hijau to-hijau-tua text-krem" },
  { judul: "Ronda malam", keterangan: "Giliran jaga di pos ronda.", ikon: ShieldCheck, latar: "from-hijau-tua to-hijau text-krem" },
  { judul: "Perayaan 17 Agustus", keterangan: "Lomba dan tawa anak-anak.", ikon: Trophy, latar: "from-jingga to-[#c97619] text-hijau-tua" },
  { judul: "Taman lingkungan", keterangan: "Taman yang dirawat bersama.", ikon: Trees, latar: "from-hijau to-[#2c7a60] text-krem" },
  { judul: "Arisan warga", keterangan: "Silaturahmi bulanan.", ikon: HandHeart, latar: "from-krem-2 to-[#e6d9bd] text-hijau" },
  { judul: "Senam pagi", keterangan: "Sehat bersama setiap Minggu.", ikon: Flower2, latar: "from-[#f0a24a] to-jingga text-hijau-tua" },
  { judul: "Rapat warga", keterangan: "Musyawarah mufakat.", ikon: Megaphone, latar: "from-[#2c7a60] to-hijau text-krem" },
  { judul: "Syukuran akhir tahun", keterangan: "Makan bersama di lapangan.", ikon: Camera, latar: "from-hijau-tua to-[#0f3328] text-krem" },
];

/* ---------------------------------------------------------------- Portal --- */

export const PORTAL: { ikon: LucideIcon; judul: string }[] = [
  { ikon: ReceiptText, judul: "Tagihan iuran" },
  { ikon: Wallet, judul: "Pembayaran" },
  { ikon: FileText, judul: "Surat pengantar" },
  { ikon: MessageSquareWarning, judul: "Pengaduan" },
  { ikon: CalendarDays, judul: "Agenda" },
];

export const JAM_LAYANAN = [
  { hari: "Senin – Jumat", jam: "19.00 – 21.00 WIB" },
  { hari: "Sabtu – Minggu", jam: "09.00 – 12.00 WIB" },
];

export const formatTanggal = (iso: string) =>
  new Date(`${iso}T00:00:00+07:00`).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
