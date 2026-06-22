import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production: produces a self-contained server in .next/standalone for Docker
  output: "standalone",
  images: {
    // Next.js 16: allow optimizing images from private IPs (localhost backend in dev)
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      // Backend uploads (development)
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000" },

      // Bizning seed/test rasmlar
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },

      // Yandex (xaritadan, search natijalardan)
      { protocol: "https", hostname: "*.mds.yandex.net" },
      { protocol: "https", hostname: "*.yandex.net" },
      { protocol: "https", hostname: "*.yandex.com" },
      { protocol: "https", hostname: "*.yandex.uz" },
      { protocol: "https", hostname: "*.yandex.ru" },

      // Google
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },

      // Object storage
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },

      // CDN'lar
      { protocol: "https", hostname: "cdn.olx.uz" },
      { protocol: "https", hostname: "*.olx.uz" },
      { protocol: "https", hostname: "*.uybor.uz" },

      // Telegram (rasm yuborish bo'yicha)
      { protocol: "https", hostname: "*.telegram.org" },

      // Imgur
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "imgur.com" },
    ],
  },
};

export default nextConfig;
