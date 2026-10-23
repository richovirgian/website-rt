import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
  randomBytes,
} from "node:crypto";

/**
 * Enkripsi data identitas (NIK) saat disimpan.
 *
 * Kunci induk berasal dari env ENKRIPSI_KUNCI (32 byte, base64). Dua kunci
 * turunan dipakai untuk dua keperluan berbeda, jadi satu kunci tidak pernah
 * dipakai ganda: satu untuk AES-256-GCM, satu untuk HMAC pencocok duplikat.
 *
 * KUNCI TIDAK BOLEH HILANG atau berganti. Tanpanya NIK yang sudah tersimpan
 * tidak bisa dibuka lagi. Simpan salinan di tempat yang aman, terpisah dari
 * database.
 *
 * Format ciphertext: "v1:<iv>:<tag>:<data>" (base64). Awalan versi
 * memungkinkan rotasi kunci kelak tanpa menebak format.
 */

function kunciInduk(): Buffer {
  const mentah = process.env.ENKRIPSI_KUNCI?.trim();
  if (!mentah) {
    throw new Error(
      "ENKRIPSI_KUNCI belum diisi. Buat dengan: openssl rand -base64 32",
    );
  }
  const k = Buffer.from(mentah, "base64");
  if (k.length !== 32) {
    throw new Error(
      `ENKRIPSI_KUNCI harus 32 byte (base64), ditemukan ${k.length} byte.`,
    );
  }
  return k;
}

function turunan(tujuan: "enkripsi" | "hash"): Buffer {
  return Buffer.from(
    hkdfSync("sha256", kunciInduk(), Buffer.alloc(0), `warga:${tujuan}`, 32),
  );
}

export function enkripsi(teks: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", turunan("enkripsi"), iv);
  const data = Buffer.concat([c.update(teks, "utf8"), c.final()]);
  return ["v1", iv.toString("base64"), c.getAuthTag().toString("base64"), data.toString("base64")].join(":");
}

export function dekripsi(nilai: string): string {
  const [versi, iv, tag, data] = nilai.split(":");
  if (versi !== "v1" || !iv || !tag || !data) {
    throw new Error("Format data terenkripsi tidak dikenali.");
  }
  const d = createDecipheriv("aes-256-gcm", turunan("enkripsi"), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(data, "base64")), d.final()]).toString("utf8");
}

/** HMAC deterministik untuk mencocokkan duplikat tanpa membuka isinya. */
export function hashIdentitas(teks: string): string {
  return createHmac("sha256", turunan("hash")).update(teks).digest("hex");
}
