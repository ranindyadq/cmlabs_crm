"use client";
import Image from "next/image";
import { useTheme } from "@/lib/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { Illustration } from '@/components/illustrations/Illustration';
import DecorativeBackground from '@/components/icons/DecorativeBackground';
import { usePathname } from "next/navigation"; // ✅ Tambahan

interface AuthLayoutProps {
  children: React.ReactNode;
  reverse?: boolean;
  branding?: boolean;
  showToggle?: boolean;
}

export default function AuthLayout({
  children,
  reverse = false,
  branding = true,
  showToggle = false,
}: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname(); // ✅ Deteksi halaman aktif

  // Cek apakah halaman sekarang SignIn / SignUp
  const isAuthPage =
    pathname === "/auth/signin" || pathname === "/auth/signup";

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-8 ${
        isDark ? "bg-[#2B265E]" : "bg-[#F0F2F5]"
      }`}
    >
      <div
        className={`flex w-full max-w-3xl
          bg-white dark:bg-[#1E1E1E]
          rounded-3xl shadow-lg overflow-hidden relative
          flex-col md:flex-row
          h-auto md:h-[85vh]
        `}
        style={{ backgroundColor: isDark ? "#3B3285" : "white" }}
      >
        {/* Toggle theme button */}
        {showToggle && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={() => theme !== "light" && toggleTheme()}
              className={`p-2 rounded-md ${
                theme === "light" ? "bg-[#5A4FB5] text-white" : "text-gray-400"
              }`}
            >
              <Sun size={18} strokeWidth={2} />
            </button>
            <button
              onClick={() => theme !== "dark" && toggleTheme()}
              className={`p-2 rounded-md ${
                theme === "dark" ? "bg-[#5A4FB5] text-white" : "text-gray-400"
              }`}
            >
              <Moon size={18} strokeWidth={2} />
            </button>
          </div>
        )}

        {reverse ? (
          <>
            <BrandingBlock className="w-full md:w-1/2 h-32 md:h-full" isAuthPage={isAuthPage} />
            <div className="w-full md:w-1/2 h-full p-6 md:p-12 flex flex-col justify-center">
              {children}
            </div>
          </>
        ) : (
          <>
            <div className="w-full md:w-1/2 h-full p-6 md:p-12 flex flex-col justify-center order-2 md:order-1">
              {children}
            </div>
            <BrandingBlock className="w-full md:w-1/2 h-32 md:h-full order-1 md:order-2" isAuthPage={isAuthPage} />
          </>
        )}
      </div>
    </div>
  );
}

// 🟣 Branding Block - update agar dinamis
function BrandingBlock({
  className = "",
  isAuthPage,
}: {
  className?: string;
  isAuthPage?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-b from-[#6A5FDB] to-[#4A438A] ${className}`}>
      {/* Background */}
      <DecorativeBackground
        className="absolute inset-0 z-0 w-full h-full drop-shadow-xl"
        preserveAspectRatio="xMidYMid slice"
      />

      {/* Konten */}
      <div className="relative z-10 flex flex-col h-full p-6 text-white">
        {/* Logo */}
        <div className="flex justify-start md:justify-end mb-autoshrink-0 mb-4 md:mb-auto">
          <div
            className="
              relative 
              w-[60px] h-[20px]
              sm:w-[75px] sm:h-[25px]
              md:w-[95px] md:h-[30px]
            "
          >
            <Image
              src="/logo.png"
              alt="CMLABS Logo"
              fill
              priority
              className="object-contain"
              sizes="(max-width: 640px) 90px, (max-width: 768px) 110px, 120px"
            />
          </div>
        </div>

        {/* Kalau halaman SignIn/SignUp → tampil lengkap */}
        {isAuthPage && (
          <div className="flex flex-col justify-center items-center text-center">
            <h1
              suppressHydrationWarning
              className="text-3xl font-bold bg-gradient-to-r from-[#FFFFFF] to-[#C7F500] bg-clip-text text-transparent mb-7"
            >
              Welcome Page
            </h1>
            <div className="hidden md:block relative w-56 h-56 mb-4">
              <Illustration />
            </div>
            <p className="hidden md:block text-base font-light opacity-90 mt-1 bg-gradient-to-r from-[#FFFFFF] to-[#C7F500] bg-clip-text text-transparent">
              Let's make business easier
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="hidden md:block mt-auto"></div>
      </div>
    </div>
  );
}
