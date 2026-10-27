# PRD — Ekosistem Warga

## Status Dokumen

- Status: rancangan produk V1; siap menjadi dasar ERD dan implementasi setelah disetujui.
- Produk: **Ekosistem Warga**.
- Bentuk layanan: SaaS multi-tenant untuk pengelolaan operasional RT.
- Unit pelanggan: satu RT adalah satu tenant.
- Contoh portal: `rt04rw02.ekosistemwarga.id`.
- Batas dokumen: kebutuhan produk dan keputusan data V1; belum merupakan migrasi SQL atau kontrak API final.

## Ringkasan Produk

Ekosistem Warga membantu pengurus RT menjalankan administrasi warga, iuran, kas, surat, pengumuman, pengaduan, kegiatan, dan konten portal secara digital. Warga mengakses portal RT mereka sendiri; pengurus RT A tidak dapat melihat maupun mengelola data RT B.

Platform memakai **satu database produksi PostgreSQL/Supabase** bernama `ekosistem_warga`. Pemisahan data dilakukan oleh `tenant_id` pada setiap data operasional milik RT. Database tunggal dipilih agar biaya, operasional, backup, analitik platform, dan pengembangan awal tetap ringan tanpa mengorbankan isolasi aplikasi.

## Masalah yang Diselesaikan

| Masalah saat ini | Dampak | Hasil yang diharapkan |
| --- | --- | --- |
| Data warga, rumah, dan keluarga tersebar di chat atau spreadsheet | Data ganda dan sulit dicari | Satu sumber data warga per RT |
| Iuran ditagih dan dicatat manual | Status pembayaran tidak jelas | Tagihan, bukti, kuitansi, dan kas tercatat runtut |
| Surat serta pengaduan melalui chat pribadi | Riwayat dan SLA sulit dipantau | Pengajuan serta status dapat dipantau warga dan pengurus |
| Informasi kegiatan/pengumuman tercecer | Partisipasi rendah | Portal menjadi kanal informasi resmi RT |
| Setiap RT memerlukan aplikasi sendiri | Biaya dan pemeliharaan tinggi | Satu platform, portal dan data tetap terpisah per RT |

## Pengguna dan Peran

| Aktor | Tujuan utama | Hak akses V1 |
| --- | --- | --- |
| Pemilik platform | Mengelola tenant, paket, tagihan SaaS, dan domain | Lintas tenant, terbatas untuk operasi platform |
| Admin RT | Mengelola konfigurasi RT, warga, konten, dan anggota pengurus | Hanya tenant RT-nya |
| Bendahara RT | Mengelola iuran, pembayaran, bukti, kuitansi, dan kas | Hanya tenant RT-nya |
| Pengurus RT | Menangani surat, pengaduan, kegiatan, dan pengumuman | Hanya tenant RT-nya sesuai peran |
| Warga | Melihat portal, tagihan sendiri, mengajukan surat/pengaduan, ikut kegiatan | Hanya data yang diizinkan pada tenant RT-nya |
| Pengunjung publik | Membaca konten publik portal | Hanya konten yang dipublikasikan tenant terkait |

**Keputusan peran:** peran operasional RT tidak disimpan sebagai peran global pada akun. Peran itu disimpan pada keanggotaan tenant (`keanggotaan_tenant`), sehingga seseorang dapat menjadi bendahara pada RT A dan warga biasa pada RT B.

## Tujuan dan Non-Tujuan V1

### Tujuan

1. Menyediakan portal per RT melalui subdomain unik.
2. Mengisolasi data tenant secara konsisten di aplikasi dan database.
3. Memindahkan modul inti yang sudah ada pada mockup/schema single-RT ke struktur SaaS.
4. Mendukung pembayaran iuran manual lebih dulu, dengan fondasi gateway dan webhook tanpa menyimpan rahasia gateway di tabel bisnis.
5. Mendukung pembayaran langganan SaaS Ekosistem Warga secara terpisah dari iuran warga.

### Non-Tujuan V1

- Membuat database terpisah untuk setiap RT.
- Menyimpan nomor kartu, CVV, PIN, token rahasia, atau private key sertifikat.
- Membangun marketplace UMKM, keamanan/ronda, tamu, posyandu, donasi, fasilitas, pendidikan, atau komunitas sebelum PRD modulnya disetujui.
- Memindahkan autentikasi dari Better Auth ke Supabase Auth pada fase ini.
- Otomatis membuka rekening atau merchant account untuk setiap RT.

## Ruang Lingkup Fungsional V1

| Modul | Kebutuhan V1 | Prioritas |
| --- | --- | --- |
| Tenant & portal | Tenant, subdomain, status aktif, branding dan konfigurasi RT | P0 |
| Identitas warga | Rumah, keluarga, warga, hubungan keluarga, status domisili | P0 |
| Akses | Akun global, membership tenant, peran RT, audit tindakan | P0 |
| Iuran & kas | Jenis/aturan iuran, tagihan, pembayaran, bukti, kuitansi, kas | P0 |
| Pembayaran | Transfer/tunai manual; fondasi konfigurasi provider, transaksi, webhook | P1 |
| Administrasi | Jenis surat, pengajuan surat, lampiran, status proses | P1 |
| Komunikasi | Pengumuman, notifikasi, pengaduan dan pembaruan | P1 |
| Kegiatan | Kegiatan dan partisipasi warga | P1 |
| Konten portal | Artikel, galeri, struktur pengurus, media, pengaturan situs | P1 |
| Langganan SaaS | Paket/modul aktif, invoice SaaS, pembayaran SaaS | P1 |

## Alur Utama

### 1. Onboarding tenant

1. Pemilik platform membuat data tenant dan memilih slug/subdomain unik.
2. Domain `rt04rw02.ekosistemwarga.id` dipetakan ke tenant yang aktif.
3. Admin pertama dibuat sebagai `keanggotaan_tenant` dengan peran admin RT.
4. Admin melengkapi identitas RT, rekening tujuan iuran manual, branding, dan modul aktif.
5. Warga, rumah, dan keluarga diimpor atau dimasukkan oleh pengurus.

### 2. Iuran warga

1. Bendahara membuat jenis dan aturan iuran.
2. Sistem atau bendahara menerbitkan tagihan ke rumah/keluarga sesuai aturan.
3. Warga membayar ke rekening RT atau kanal pembayaran RT yang aktif.
4. Sistem mencatat transaksi, bukti, dan status verifikasi.
5. Setelah pembayaran tervalidasi, tagihan dan kuitansi diperbarui; transaksi kas dapat dicatat sesuai kebijakan bendahara.

### 3. Langganan SaaS

1. Ekosistem Warga menentukan paket/modul dan masa aktif tenant.
2. Invoice SaaS diterbitkan kepada tenant, bukan kepada warga.
3. Pembayaran SaaS mengarah ke rekening/merchant Ekosistem Warga.
4. Status langganan mengendalikan status layanan tenant, tanpa mencampur uang kas RT.

### 4. Surat, pengaduan, dan kegiatan

1. Warga membuat pengajuan surat atau pengaduan pada portal tenant sendiri.
2. Pengurus menindaklanjuti, memperbarui status, dan mengirim notifikasi.
3. Pengurus menerbitkan kegiatan/pengumuman; warga dapat menandai baca atau mendaftar sebagai peserta.

## Aturan Bisnis Utama

1. Semua tabel operasional milik RT wajib mempunyai `tenant_id`; query aplikasi wajib memfilter tenant aktif.
2. `tenant.slug` dan subdomain aktif bersifat unik secara global.
3. Nomor rumah, nama jenis iuran, slug artikel, dan kode dokumen hanya unik dalam tenant terkait, kecuali ditetapkan lain.
4. Satu akun dapat menjadi anggota lebih dari satu tenant, tetapi hak akses ditentukan per membership.
5. NIK tidak disimpan polos: gunakan ciphertext, hash untuk deduplikasi yang aman, dan empat digit akhir untuk tampilan tersamar.
6. Data pembayaran iuran harus selalu membawa `tenant_id`; rekening tujuan berasal dari konfigurasi payment tenant, bukan invoice SaaS.
7. Uang iuran warga masuk ke rekening/merchant RT. Uang SaaS masuk ke rekening/merchant Ekosistem Warga. Kedua jenis transaksi tidak boleh dicampur.
8. Event webhook harus idempoten berdasarkan `provider + provider_event_id`; event yang sama tidak boleh mengubah transaksi dua kali.
9. Bukti/media disimpan di Supabase Storage atau object storage; database hanya menyimpan metadata dan path objek.
10. Audit log hanya ditambah dan tidak memuat password, token, nomor kartu, CVV, maupun rahasia provider.

## Kebutuhan Non-Fungsional

| Area | Ketentuan V1 |
| --- | --- |
| Isolasi tenant | Resolver domain menentukan tenant; semua service dan query meneruskan `tenant_id`; RLS Supabase dipakai sebagai pertahanan tambahan setelah model akses final |
| Keamanan data | Enkripsi data PII sensitif, masking pada UI, secret di environment/secret manager, bukan tabel umum |
| Integritas | Foreign key, unique composite, check constraint, dan transaksi database pada perubahan pembayaran |
| Kinerja | Indeks berawalan `tenant_id` untuk list/filter utama; pagination untuk daftar warga, tagihan, audit, dan notifikasi |
| Ketersediaan | Backup dan pemulihan diuji pada level satu database produksi; tidak ada dependensi database per RT |
| Observabilitas | Audit log, catatan webhook, ID korelasi provider, dan error terstruktur |
| Skalabilitas | Awal memakai satu database; pisah database/shard hanya jika metrik beban dan kebutuhan isolasi benar-benar menuntut |

## Keputusan Arsitektur Data

| Keputusan | Pilihan | Alasan |
| --- | --- | --- |
| Jumlah database produksi | 1 PostgreSQL/Supabase | Paling hemat dan sederhana pada tahap awal |
| Isolasi data | Kolom `tenant_id` + guard aplikasi + RLS | Mendukung SaaS tanpa database per RT |
| Subdomain | `domain_tenant` sebagai registry | DNS/SSL tidak dicatat sebagai data operasional tenant; dikelola oleh infrastruktur |
| Auth | Tetap Better Auth dahulu | Menghindari migrasi auth bersamaan dengan perubahan tenantisasi |
| Media | Supabase Storage | File besar/biner tidak membebani row PostgreSQL |
| Pembayaran | Kanal manual tenant (`cash`, transfer, QRIS statis) | V1 tidak bergantung provider; gateway/webhook hanya ditambah setelah provider dipilih |

## Model Bisnis V1 — Disepakati

### Pihak yang Membayar

- Pelanggan adalah **organisasi RT**, bukan setiap warga secara individual.
- Biaya aplikasi dibayar dari kas RT atau keputusan musyawarah RT.
- Warga tidak dikenai biaya aplikasi tambahan oleh Ekosistem Warga; warga hanya membayar iuran lingkungan RT yang memang berlaku.

### Harga dan Masa Layanan

| Komponen | Keputusan V1 |
| --- | --- |
| Model | SaaS prabayar, perpanjangan setiap 6 bulan |
| Paket awal | `Founder RT`, maksimal 100 KK |
| Harga awal | Rp299.000 per 6 bulan |
| Setara biaya | Sekitar Rp49.833 per bulan untuk satu RT |
| Trial | 30 hari untuk onboarding, input data, dan evaluasi |
| Harga lanjutan | Ditinjau setelah validasi fitur, biaya operasional, dan dukungan pelanggan; bukan perubahan otomatis untuk tenant founder aktif |
| Kontrak | Tidak memakai kontrak legal jangka panjang pada V1; tenant menyetujui S&K digital saat onboarding |

### Status Langganan dan Penghentian

1. Sistem mengirim pengingat perpanjangan pada H-30 dan H-7 sebelum masa aktif berakhir.
2. Tenant yang belum membayar menerima masa tenggang **14 hari**.
3. Setelah masa tenggang habis, portal menjadi **read-only**: data tetap dapat dilihat atau diekspor, tetapi operasi baru seperti menerbitkan tagihan, mencatat pembayaran, dan memproses surat diblokir.
4. Tidak ada denda maupun pemutusan kontrak otomatis. Tenant dapat tidak memperpanjang kapan saja.
5. Pembayaran yang terverifikasi mengaktifkan kembali tenant dan memperpanjang masa layanan selama 6 bulan.

### Mekanisme Pembayaran

| Jenis pembayaran | Penerima dana | Kanal V1 | Proses |
| --- | --- | --- |
| Langganan aplikasi SaaS | Ekosistem Warga | QRIS statis, transfer bank, atau cash | RT mengunggah bukti bila perlu; admin platform memverifikasi dan mengaktifkan langganan |
| Iuran warga | Rekening/QRIS milik RT | Cash, transfer bank, atau QRIS | Bendahara RT melakukan verifikasi manual pada V1 |

- Ekosistem Warga tidak mengambil fee per transaksi iuran warga pada V1.
- Jika ada biaya kanal QRIS, kebijakan awal yang direkomendasikan adalah ditanggung kas RT, bukan ditambahkan otomatis ke tagihan warga.
- QRIS dinamis dan verifikasi otomatis melalui webhook adalah fase berikutnya, setelah provider, merchant model, dan volume transaksi terbukti membutuhkan otomatisasi.
- Iuran V1 dibayar penuh dalam satu transaksi; cicilan/pembayaran sebagian tidak termasuk scope awal.

## Metrik Sukses Awal

- Tenant baru dapat aktif beserta admin dan subdomain terpetakan tanpa membuat database baru.
- Tidak ada query operasional lintas tenant tanpa filter `tenant_id`.
- Bendahara dapat melihat status tagihan dan pembayaran tenant-nya secara konsisten.
- Warga dapat mengajukan surat/pengaduan dan melihat riwayat sendiri.
- Pembayaran webhook duplikat tidak menyebabkan pencatatan ganda.

## Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Query lupa memfilter tenant | Kebocoran data antar-RT | Repository/service tenant-aware, review, test negatif, dan RLS |
| Peran global dipakai untuk admin RT | Hak akses silang tenant | Pindahkan peran operasional ke `keanggotaan_tenant` |
| Gateway belum disepakati | Implementasi pembayaran salah arah | V1 manual; finalisasi provider sebelum integrasi live |
| Media disimpan sebagai bytes DB | Database cepat membesar | Migrasi ke object storage sebelum produksi |
| Modul mockup belum punya aturan bisnis | Tabel prematur dan mahal diubah | Jadikan roadmap, buat PRD modul sebelum ERD detail |

## Pertanyaan yang Masih Perlu Diputuskan

1. Apakah satu RT bisa memakai lebih dari satu rekening/merchant aktif (misalnya iuran dan donasi)? Rancangan mendukungnya, kebijakan UI belum diputuskan.
2. Apakah tagihan dibuat per rumah, per keluarga, atau per warga untuk setiap jenis iuran? Schema mendukung target rumah/keluarga/warga, namun aturan penerbitannya harus ditetapkan per jenis iuran.
3. Apakah setelah fase founder akan ada paket lanjutan (misalnya di atas 100 KK, dukungan prioritas, atau fitur premium)?
4. Provider pembayaran apa yang akan dipakai untuk SaaS dan, bila diperlukan, untuk RT? Tidak ada integrasi live sebelum provider serta model merchant disetujui.
5. Apakah undangan warga memakai link WhatsApp, SMS OTP, atau email? V1 mengasumsikan admin input/impor terlebih dahulu dan warga aktivasi melalui undangan.

## Acceptance Criteria Dokumen Ini

- Nama produk dan model SaaS memakai **Ekosistem Warga** dan portal per RT.
- Arsitektur menyatakan satu database produksi dengan isolasi `tenant_id`.
- Alur pembayaran iuran RT dipisahkan dari pembayaran SaaS.
- Modul V1, batasan, risiko, dan keputusan terbuka terdaftar.
- Detail tabel, kolom, relasi, indeks, sumber field, dan pemetaan schema lama tersedia pada `docs/ERD-Ekosistem-Warga.md`.
