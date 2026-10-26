# Website RT

Sistem manajemen warga untuk satu RT: data warga, iuran dan tagihan, pembayaran (tunai, transfer manual, payment gateway), kas, surat, pengumuman, dan pengaduan.

Next.js 16 (App Router) full-stack, Prisma 7, PostgreSQL, better-auth. Status pengerjaan ada di [docs/progress.md](docs/progress.md).

## Menjalankan

npm install
npx prisma migrate dev       # buat tabel
npm run rt:akun              # buat akun admin pertama
npm run dev
```

Buka http://localhost:3000, lalu masuk lewat `/admin/masuk`.

## Perintah

- `npm run build` / `npm start`
- `npm run lint` / `npm run typecheck`
- `npm run db:deploy` / `npm run db:status`
- `npm run rt:akun` membuat akun (pendaftaran mandiri dimatikan)

## Dokumen

- [Arsitektur](docs/architecture.md)
- [ERD](docs/erd.md)
- [Matriks role dan izin](docs/role-permission-matrix.md)
- [Alur bisnis](docs/business-workflows.md)
- [Prompt pengerjaan](docs/prompt-sistem-rt.md)
