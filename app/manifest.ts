import type { MetadataRoute } from "next";

/**
 * Manifes aplikasi web. Membuat situs bisa dipasang ke layar utama ponsel
 * dan dibuka layaknya aplikasi (tanpa bilah alamat). Tidak ada service
 * worker: aplikasi tetap perlu internet karena datanya selalu dari server.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Warga Blok G",
    short_name: "Warga G",
    description: "Portal warga RT 04 RW 02: iuran, tagihan, dan layanan warga.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "id",
    background_color: "#fbf6ec",
    theme_color: "#1f5f4a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
