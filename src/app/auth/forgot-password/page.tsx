"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import InputWithLabel from "@/components/ui/InputWithLabel";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useTheme } from "@/lib/context/ThemeContext";
// PERBAIKAN 1: Ganti import API lama dengan apiClient baru
import apiClient from "@/lib/apiClient"; 
import { HiArrowLongLeft } from "react-icons/hi2";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // PERBAIKAN 2: Gunakan apiClient.post ke endpoint Next.js yang benar
      // Endpoint ini sesuai dengan file: src/app/api/auth/password-reset/request/route.ts
      await apiClient.post("/auth/password-reset/request", { email });

      // Jika sukses, redirect ke halaman konfirmasi
      router.push(`/auth/check-email?email=${encodeURIComponent(email)}`);
      
    } catch (err: any) {
      console.error(err);
      // Ambil pesan error dari backend jika ada
      const errorMessage = err.response?.data?.message || "Unable to send reset link. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2"></div>
        <h2 className="text-center text-3xl font-semibold mb-3 text-[#5A4FB5] dark:text-[#9083F5]">
          Forgot Password
        </h2>
        <p className={`text-center text-xs mb-6 ${isDark ? "text-gray-200" : "text-gray-600"}`}>
          No worries! Enter your email and we’ll send you a reset link.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <InputWithLabel
            label="Email"
            type="email"
            placeholder="Enter your email"
            name="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6A5FDB] hover:bg-[#7E72E5] transition-all text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50"
            >
              {loading ? "Sending..." : "Reset Password"}
            </button>
          </div>
        </form>
      </div>

      <div className="flex justify-center mt-4">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-xs text-[#5A4FB5] dark:text-[#9083F5] hover:underline"
        >
          <HiArrowLongLeft className="w-4 h-4" />
          Back to Log In
        </Link>
      </div>
    </AuthLayout>
  );
}