// File: tailwind.config.ts (Buat file ini di root directory Anda)

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Wajib agar dark mode bekerja
  darkMode: 'class', 
  theme: {
    extend: {
      // 📝 Font Family sesuai Guideline (Poppins) [cite: 98]
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      
      // 🎨 Custom Colors sesuai Guideline
      colors: {
        // --- Primary Palette ---
        'crm-primary': { // Palm Purple [cite: 53]
          DEFAULT: '#5A4FB5',
          light: '#E7D8FF', // Warna yang muncul di DecorativeBackground.tsx (Linear Gradient Stop 1)
          // Anda bisa menambahkan varian hover/active di sini, misalnya:
          hover: '#7A6FD1', // Varian sedikit lebih terang dari primary
        },
        'crm-secondary': '#CAA9FF', // Pale Violet [cite: 54]
        'crm-accent': '#C7FB00',   // Lime [cite: 55]

        // --- Semantic Colors ---
        'crm-success': { // Dark Spring Green [cite: 60]
          DEFAULT: '#257047',
          bg: '#E5F9EE', // Digunakan di Reset Status Page untuk background icon sukses
        },
        'crm-warning': '#FFAB00',   // Yellow Sea [cite: 61]
        'crm-error': '#C11106',     // Milano Red [cite: 63, 64]
        'crm-info': '#2D8EFF',      // Rodger Blue [cite: 66, 67]

        // --- Neutrals & Background ---
        'crm-black': '#000000',      // Black [cite: 71]
        'crm-dark-grey': '#595959',  // Dark Grey [cite: 76]
        'crm-white': '#FFFFFF',      // White [cite: 78, 79]
        'crm-bg-light': '#F0F2F5',   // Cool Mist (Background Color) [cite: 74]
        'crm-bg-dark': '#2B265E',    // Warna gelap custom untuk dark mode background utama
        'crm-card-dark': '#3B3285',  // Warna gelap custom untuk card/modal di dark mode
      },

      // 🔳 Shadow sesuai Guideline [cite: 367, 372, 377]
      boxShadow: {
        // Drop Shadow Sidebar: Hexcode #ACACAC, Transparency 30%, Blur 10
        'crm-sidebar': '0 0 10px rgba(172, 172, 172, 0.3)',
        // Drop Shadow Content Cards: Hexcode #979595, Transparency 30%, Blur 5
        'crm-content-card': '0 0 5px rgba(151, 149, 149, 0.3)',
        // Drop Shadow Pop up Forms/Modal: Hexcode #000000, Transparency 50%, Blur 5
        'crm-modal': '0 0 5px rgba(0, 0, 0, 0.5)',
      },
      
      // 📐 Radius sesuai Guideline [cite: 386, 387]
      borderRadius: {
        'crm-container': '20px', // Dashboard widget, Popup, Section besar
        'crm-content': '10px',   // Customer card, Leads detail, Team member row
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // <-- Tambahkan ini
  ],
};

export default config;