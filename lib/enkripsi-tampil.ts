/**
 * Penyamaran NIK untuk tampilan. Dipisah dari lib/enkripsi.ts karena berkas itu
 * memakai modul crypto Node dan hanya boleh diimpor kode server, sedangkan
 * penyamaran ini dipakai komponen peramban.
 */
export function samarkanNik(akhir4: string | null | undefined): string {
  return akhir4 ? `••••••••••••${akhir4}` : "—";
}
