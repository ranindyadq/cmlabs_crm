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
    ],
  },
};

export default nextConfig;