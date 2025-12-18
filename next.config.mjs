/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true, // 👈 Tambahkan baris ini
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