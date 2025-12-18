"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
// Hapus import ThemeToggleButton

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "#fitur", label: "Features" },
    { href: "#harga", label: "Pricing" },
  ];

  return (
    // Hapus kelas 'dark:'
    <header className="sticky top-0 w-full bg-white/90 backdrop-blur-sm border-b border-gray-200 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          // Hapus 'dark:text-white'
          className="flex items-center gap-2.5 font-bold text-xl text-gray-900 transition-colors duration-300"
        >
          <Image
            src="/logooo.png"
            alt="CRM cmlabs Logo"
            width={70}  // Ukuran yang benar
            height={70} // Ukuran yang benar
          />
          {/* Anda bisa tambahkan "CRM" di sini jika mau */}
        </Link>

        {/* Navigasi Desktop */}
        <nav className="hidden md:flex gap-4 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              // Hapus kelas 'dark:'
              className="text-gray-800 hover:text-indigo-600 transition-colors duration-300"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/auth/signin"
            // Hapus kelas 'dark:'
            className="font-semibold text-primary hover:bg-primary/20 px-4 py-2 rounded-md transition-colors duration-300"
          >
            Login
          </Link>
          <Link
            href="/auth/signup"
            // Hapus kelas 'dark:'
            className="bg-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-primary-hover transition-colors duration-300"
          >
            Try it free
          </Link>
          {/* Hapus komponen ThemeToggleButton */}
        </nav>

        {/* Tombol Hamburger */}
        <div className="md:hidden flex items-center gap-2">
          {/* Hapus komponen ThemeToggleButton */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            // Hapus kelas 'dark:'
            className="text-gray-900 transition-colors duration-300"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        // Hapus kelas 'dark:'
        <div className="md:hidden w-full bg-white border-t border-gray-200 pb-6 transition-colors duration-300">
          <nav className="flex flex-col items-center gap-4 px-4 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                // Hapus kelas 'dark:'
                className="text-lg text-gray-900 hover:text-indigo-600 transition-colors duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {/* Tombol Login untuk Mobile */}
            <Link
              href="/auth/signin"
              className="w-full text-center font-semibold text-indigo-600 hover:bg-indigo-100 px-5 py-3 rounded-md transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Login
            </Link>
            {/* Tombol Sign Up untuk Mobile */}
            <Link
              href="/auth/signup"
              // Hapus kelas 'dark:'
              className="w-full text-center bg-indigo-600 text-white px-5 py-3 rounded-md font-semibold hover:bg-indigo-700 transition-colors duration-300"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Try it free
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}