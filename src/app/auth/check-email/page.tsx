"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useTheme } from "@/lib/context/ThemeContext";
import { HiArrowLongLeft } from "react-icons/hi2";
import { HiOutlineMail } from "react-icons/hi";
import apiClient from "@/lib/apiClient"; // Import Client API

// 1. PISAHKAN KONTEN KE KOMPONEN SENDIRI (AGAR BISA DISBUNGKUS SUSPENSE)
function CheckEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const email = params.get("email");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // State untuk Resend Logic
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [message, setMessage] = useState("");

  // Redirect jika tidak ada email di URL
  useEffect(() => {
    if (!email) {
      router.replace("/auth/forgot-password");
    }
  }, [email, router]);

  // Logika Countdown Timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOpenGmail = () => {
    window.open("https://mail.google.com", "_blank");
  };

  // FUNGSI RESEND (API CALL)
  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    setMessage("");

    try {
      // Panggil endpoint yang SAMA dengan halaman Forgot Password
      await apiClient.post("/auth/password-reset/request", { email });
      
      setMessage("Email sent successfully!");
      setCountdown(60); // Jeda 60 detik
    } catch (error) {
      setMessage("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="text-center flex flex-col justify-center items-center">
      <div className="mx-auto mb-2 flex items-center justify-center w-[90px] h-[90px] rounded-full bg-[#F2F1FA] shadow-md ">
        <HiOutlineMail className="w-10 h-10 text-[#5A4FB5]" />
      </div>
      
      <h2 className="text-3xl font-semibold mb-2 text-[#5A4FB5] dark:text-[#9083F5]">Check your email</h2>
      
      <p className={`mt-1 text-xs ${isDark ? "text-gray-300" : "text-gray-600"} mb-6`}>
        We sent a password reset link to your email <span className="font-bold">{email}</span>.  
        The link is valid for 1 hour. Please check your inbox!
      </p>

      {/* FEEDBACK MESSAGE (Sukses/Gagal Resend) */}
      {message && (
        <div className={`mb-4 text-xs px-4 py-2 rounded-lg ${
          message.includes("success") 
            ? "bg-green-100 text-green-700 border border-green-200" 
            : "bg-red-100 text-red-700 border border-red-200"
        }`}>
          {message}
        </div>
      )}

      <button
        onClick={handleOpenGmail}
        className="w-full bg-[#6A5FDB] hover:bg-[#7E72E5] transition-all text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 mb-3"
      >
        Open Gmail
      </button>

      <div className="pt-2">
        <p className={`text-xs text-center ${isDark ? "text-white" : "text-black"}`}>
          Didn’t get the email?{" "}
          
          {/* LOGIKA TAMPILAN RESEND */}
          {countdown > 0 ? (
            <span className="text-gray-400 cursor-not-allowed font-medium">
              Resend in {countdown}s
            </span>
          ) : (
            <button 
              onClick={handleResend}
              disabled={resending}
              className="text-[#5A4FB5] dark:text-[#9083F5] font-light hover:underline"
            >
              {resending ? "Sending..." : "Click here to resend"}
            </button>
          )}
        </p>

        <div className="flex justify-center mt-4">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 text-xs text-[#5A4FB5] dark:text-[#9083F5] hover:underline"
          >
            <HiArrowLongLeft className="w-4 h-4" />
            Back to Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

// 2. EXPORT HALAMAN UTAMA (DIBUNGKUS SUSPENSE)
export default function CheckEmailPage() {
  return (
    <AuthLayout branding={false}>
      {/* Wajib pakai Suspense karena ada useSearchParams */}
      <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
        <CheckEmailContent />
      </Suspense>
    </AuthLayout>
  );
}