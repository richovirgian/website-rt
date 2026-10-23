import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin root: ada package-lock.json lain di home dir yang bikin Next salah
  // menebak workspace root.
  turbopack: { root: __dirname },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
