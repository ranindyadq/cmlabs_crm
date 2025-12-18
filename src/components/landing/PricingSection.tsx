// components/landing/PricingSection.tsx

"use client"; // Diperlukan untuk state (toggle) dan animasi (hover)
import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion'; // Impor motion untuk animasi

// Definisikan struktur data untuk paket
type PricingPackage = {
  name: string;
  description: string;
  monthlyPrice: number | null; 
  annualPrice: number | null;
  isPopular: boolean;
  features: string[];
  ctaText: string;
  ctaLink: string;
};

// Data untuk 3 paket (diperbarui ke Bahasa Inggris & sesuai fitur Anda)
const packages: PricingPackage[] = [
  {
    name: 'Free',
    description: 'For individuals & freelancers just getting started.',
    monthlyPrice: 0,
    annualPrice: 0,
    isPopular: false,
    features: [
      '1 User',
      'Up to 500 Contacts',
      'Basic Lead Management',
      '1 Sales Pipeline',
    ],
    ctaText: 'Start for Free',
    ctaLink: '/auth/signup?plan=free',
  },
  {
    name: 'Pro',
    description: 'Best for small teams that need automation and analytics.',
    monthlyPrice: 15, // Ganti harga sesuai keinginan Anda
    annualPrice: 12, 
    isPopular: true,
    features: [
      'Everything in Free, plus:',
      'Up to 10 Users',
      'Unlimited Contacts',
      'Kanban Board View',
      'Basic Dashboard & Analytics',
      'Team Management',
    ],
    ctaText: 'Start 14-Day Free Trial',
    ctaLink: '/auth/signup?plan=pro',
  },
  {
    name: 'Enterprise',
    description: 'For large teams needing full customization and support.',
    monthlyPrice: null, // Harga kustom
    annualPrice: null,
    isPopular: false,
    features: [
      'Everything in Pro, plus:',
      'Unlimited Users',
      'Advanced Analytics & Exporting',
      'Custom Roles & Permissions',
      'Priority 24/7 Support',
      'Full API Access',
    ],
    ctaText: 'Contact Sales',
    ctaLink: '/contact-sales',
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  // Helper untuk format mata uang (ganti ke USD)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    // Gunakan 'bg-bg-alt' agar konsisten
    <section id="harga" className="bg-[#CAA9FF]/20 py-20">
      <div className="container mx-auto px-4">
        
        {/* Judul yang diperbarui */}
        <h2 className="text-3xl font-bold text-center mb-4 text-text-strong">
          Choose the <span className="text-primary">Right Plan</span> for You
        </h2>
        <p className="text-center text-foreground mb-12 max-w-xl mx-auto">
          Start for free, then upgrade as your team grows. Simple,
          transparent pricing with no hidden fees.
        </p>

        {/* Toggle Bulanan/Tahunan (diperbarui ke warna primary) */}
        <div className="flex justify-center items-center mb-12 space-x-4">
          <span
            className={`font-semibold ${
              !isAnnual ? 'text-primary' : 'text-foreground'
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ${
              isAnnual ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            } transition-colors duration-200 ease-in-out focus:outline-none`}
            role="switch"
            aria-checked={isAnnual}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 ${
                isAnnual ? 'translate-x-5' : 'translate-x-0'
              } transition duration-200 ease-in-out`}
            />
          </button>
          <span
            className={`font-semibold ${
              isAnnual ? 'text-primary' : 'text-foreground'
            }`}
          >
            Annual
            <span className="ml-2 text-sm font-normal text-success bg-success/10 px-2 py-0.5 rounded-full">
              Save 20%
            </span>
          </span>
        </div>

        {/* Grid Kartu Harga */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg) => (
            // Tambahkan motion.div dan whileHover
            <motion.div
              key={pkg.name}
              whileHover={{ 
                y: -5, 
                boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)", 
                transition: { duration: 0.2 } 
              }}
              // Perbarui style kartu agar konsisten
              className={`relative flex flex-col bg-card p-8 rounded-xl border ${
                pkg.isPopular 
                  ? 'border-primary border-2 shadow-2xl md:scale-105 z-10' // Diperbarui
                  : 'border-border shadow-lg' // Diperbarui
              }`}
            >
              {/* Badge Populer (diperbarui ke warna primary) */}
              {pkg.isPopular && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-4 py-1 rounded-full uppercase">
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-semibold mb-2 text-text-strong">{pkg.name}</h3>
              <p className="text-foreground mb-6 h-12">{pkg.description}</p>

              {/* Info Harga */}
              <div className="mb-6">
                {pkg.monthlyPrice === null ? (
                  <span className="text-4xl font-bold text-text-strong">Custom</span>
                ) : (
                  <span className="text-4xl font-bold text-text-strong">
                    {formatCurrency(
                      isAnnual ? pkg.annualPrice! : pkg.monthlyPrice
                    )}
                  </span>
                )}
                {pkg.monthlyPrice !== null && pkg.monthlyPrice > 0 && (
                  <span className="text-foreground"> /user/month</span>
                )}
                {pkg.monthlyPrice !== null && pkg.monthlyPrice > 0 && (
                  <p className="text-sm text-foreground mt-2">
                    {isAnnual ? 'Billed annually' : 'Billed monthly'}
                  </p>
                )}
              </div>

              {/* Daftar Fitur (diperbarui ke warna success) */}
              <ul className="space-y-3 mb-8 flex-grow">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Tombol CTA (diperbarui ke warna primary) */}
              <Link
                href={pkg.ctaLink}
                className={`w-full text-center px-6 py-3 rounded-md font-semibold ${
                  pkg.isPopular
                    ? 'bg-primary text-white hover:bg-primary-hover'
                    : 'bg-card text-primary border border-primary hover:bg-primary/10'
                } transition-colors`}
              >
                {pkg.ctaText}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}