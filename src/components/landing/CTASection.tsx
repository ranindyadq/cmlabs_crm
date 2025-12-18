// components/landing/CTASection.tsx

"use client"; 
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';

// Varian animasi (tetap sama)
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: "easeOut" 
    } 
  },
};

export default function CTASection() {
  return (
    // 1. Latar belakang section diubah menjadi 'bg-background' (putih)
    <section id="cta" className="bg-background py-20">
      <div className="container mx-auto px-4">
        
        {/* 2. KARTU diubah menjadi GRADIENT UNGU (Primary ke Secondary) */}
        <motion.div 
          className="bg-gradient-to-br from-primary to-secondary max-w-4xl mx-auto p-12 md:p-16 text-center rounded-xl shadow-lg"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={sectionVariants}
        >
          
          {/* 3. Teks diubah menjadi PUTIH. Highlight diubah menjadi 'text-accent' (Lime) agar menonjol */}
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Grow Your <span className="text-accent">Business</span>?
          </h2>
          
          {/* 4. Teks paragraf diubah menjadi putih transparan */}
          <p className="text-lg mb-8 text-white/80 max-w-xl mx-auto">
            Start your 14-day free trial today. No credit card, no commitments.
          </p>
          
          {/* 5. Tombol DIBALIK: Latar putih, teks ungu (primary) */}
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-primary px-8 py-3 rounded-md text-lg font-semibold 
                       hover:bg-gray-100 transition-colors duration-300
                       transform hover:scale-105"
          >
            Try it free
          </Link>
        </motion.div>
      </div>
    </section>
  );
}