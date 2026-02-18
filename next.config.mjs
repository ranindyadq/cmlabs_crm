/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Force Webpack to ignore 'canvas' (used by pdfkit but not needed in Node)
  webpack: (config) => {
      config.resolve.alias.canvas = false;
      return config;
  },
  
  experimental: {
    instrumentationHook: true, // 👈 Tambahkan baris ini
    serverComponentsExternalPackages: ['pdfkit'],
  },
  
  // Tambahkan ini jika Anda menggunakan gambar dari domain luar (misal Google User Image)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Mengizinkan semua domain gambar (untuk development)
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com', // 👈 WAJIB UNTUK VERCEL BLOB
      },
    ],
  },

  // ==========================================
  // 🛡️ SECURITY HEADERS (PENGGANTI HELMET.JS)
  // ==========================================
  async headers() {
    return [
      {
        // Terapkan ke seluruh route aplikasi
        source: '/(.*)',
        headers: [
          {
            // Mencegah Clickjacking (aplikasi tidak bisa di-embed di iframe web lain)
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // Mencegah MIME-Sniffing (memaksa browser mematuhi Content-Type)
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // Mencegah eksploitasi fitur browser (kamera, mic, geolocation) dari pihak ketiga
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // Memaksa browser selalu menggunakan HTTPS (Strict-Transport-Security)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            // Melindungi referensi URL saat berpindah halaman
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          }
        ],
      },
    ];
  },
};

export default nextConfig;