/**
 * Pembaca dan penulis CSV kecil.
 *
 * Mendukung bidang bertanda kutip (berisi koma, kutip ganda "", atau baris
 * baru), BOM, dan pemisah koma atau titik koma. Excel berbahasa Indonesia
 * menyimpan CSV dengan titik koma, jadi pemisahnya dideteksi dari baris
 * pertama, bukan diasumsikan.
 */

export function bacaCsv(teks: string): string[][] {
  const isi = teks.replace(/^﻿/, "");
  const barisPertama = isi.split(/\r?\n/, 1)[0] ?? "";
  const pemisah =
    (barisPertama.match(/;/g)?.length ?? 0) > (barisPertama.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const hasil: string[][] = [];
  let baris: string[] = [];
  let sel = "";
  let dalamKutip = false;

  for (let i = 0; i < isi.length; i++) {
    const c = isi[i];
    if (dalamKutip) {
      if (c === '"') {
        if (isi[i + 1] === '"') {
          sel += '"';
          i++;
        } else {
          dalamKutip = false;
        }
      } else {
        sel += c;
      }
    } else if (c === '"') {
      dalamKutip = true;
    } else if (c === pemisah) {
      baris.push(sel);
      sel = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && isi[i + 1] === "\n") i++;
      baris.push(sel);
      sel = "";
      hasil.push(baris);
      baris = [];
    } else {
      sel += c;
    }
  }
  if (sel !== "" || baris.length > 0) {
    baris.push(sel);
    hasil.push(baris);
  }
  // Buang baris yang seluruhnya kosong.
  return hasil.filter((b) => b.some((s) => s.trim() !== ""));
}

/**
 * Menulis satu sel CSV. Sel yang diawali = + - @ diberi apostrof di depan
 * agar tidak dijalankan sebagai rumus saat dibuka di Excel (CSV injection).
 */
export function selCsv(nilai: string | number | null | undefined): string {
  let s = nilai == null ? "" : String(nilai);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const tulisCsv = (baris: (string | number | null | undefined)[][]) =>
  "﻿" + baris.map((b) => b.map(selCsv).join(",")).join("\r\n") + "\r\n";
