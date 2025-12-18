// components/landing/Footer.tsx

import Link from 'next/link';
import Image from 'next/image'; 

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-6 py-10">
        
        {/* 1. Grid utama diubah menjadi 2 kolom (50/50) di desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* KOLOM KIRI: Brand & Ikon Sosial */}
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-white/90 p-1.5 rounded-md flex-shrink-0"> 
                <Image 
                  src="/logoo.png" 
                  alt="CRM Logo" 
                  width={24} 
                  height={24} 
                />
              </div>
              <span className="font-bold text-xl text-white">CRM</span>
            </Link>
            <p className="text-white/80 mt-4 text-sm max-w-xs">
              Unify your sales, marketing, and customer service data in one intuitive platform.
            </p>
          </div>

          {/* KOLOM KANAN: Berisi 3 kolom link */}
          {/* 2. Grid baru (nested) untuk 3 kolom link */}
          {/* 'grid-cols-2' untuk mobile & 'md:grid-cols-3' untuk desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            
            {/* Kolom Link 1: Product */}
            <div>
              <h3 className="font-semibold text-white text-lg mb-4">Product</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#fitur" className="text-sm text-white/80 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#harga" className="text-sm text-white/80 hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom Link 2: Company */}
            <div>
              <h3 className="font-semibold text-white text-lg mb-4">Company</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/about" className="text-sm text-white/80 hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact-sales" className="text-sm text-white/80 hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom Link 3: Support / Legal */}
            <div>
              <h3 className="font-semibold text-white text-lg mb-4">Support</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/privacy" className="text-sm text-white/80 hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-white/80 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
        </div>

        {/* Garis Pemisah */}
        <hr className="my-8 border-white/20" />

        {/* Copyright */}
        <div className="text-center text-white/80 text-sm">
          &copy; {new Date().getFullYear()} Team#7 CRM cmlabs. All rights reserved.
        </div>

      </div>
    </footer>
  );
}