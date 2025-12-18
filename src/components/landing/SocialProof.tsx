// components/landing/SocialProof.tsx

import Image from 'next/image'; // 1. Impor 'Image' dari Next.js

// 2. Ganti array 'clients' Anda dengan array objek
//    Setiap objek berisi 'alt' (nama) dan 'src' (path file di folder public)
const clients = [
  { alt: 'Client A Logo', src: '/perusahaan.png' },
  { alt: 'Client B Logo', src: '/perusahaan.png' },
  { alt: 'Client C Logo', src: '/perusahaan.png' },
  { alt: 'Client D Logo', src: '/perusahaan.png' },
  { alt: 'Client E Logo', src: '/perusahaan.png' },
  { alt: 'Client F Logo', src: '/perusahaan.png' },
  // Tambahkan logo Anda yang lain di sini
];

export default function SocialProof() {
  return (
    <section className="bg-primary py-16">
  <div className="container mx-auto px-6">
    <p className="text-center text-xl font-semibold text-white mb-10">
      Trusted <span className="text-accent">10,000+ companies</span> to support their business growth
    </p>

    <div className="relative overflow-hidden">
      <div className="flex w-max whitespace-nowrap animate-[scroll_30s_linear_infinite]">
        {[...clients, ...clients, ...clients].map((client, index) => (
          <div key={index} className="mx-12 flex items-center justify-center">
            <Image
            src={client.src}
            alt={client.alt}
            width={100}
            height={36}
            className="w-24 h-auto opacity-90 hover:opacity-100 transition-all duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
  );
}