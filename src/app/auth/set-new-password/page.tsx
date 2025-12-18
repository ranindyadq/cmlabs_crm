"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import InputWithLabel from "@/components/ui/InputWithLabel";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useTheme } from "@/lib/context/ThemeContext";
// PERBAIKAN 1: Ganti import API lama dengan apiClient baru
import apiClient from "@/lib/apiClient"; 
import { HiArrowLongLeft } from "react-icons/hi2";

// Komponen Form Utama (dipisah agar bisa dibungkus Suspense)
function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ✅ Cek token valid di backend
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setTokenValid(false);
        return;
      }

      try {
        // PERBAIKAN 2: Gunakan apiClient.get
        // Endpoint sesuai dengan route.ts: /api/auth/password-reset/validate?token=...
        const res = await apiClient.get(`/auth/password-reset/validate?token=${token}`);
        
        // apiClient otomatis throw error jika status bukan 2xx
        if (res.data.userId) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
        }
      } catch (err) {
        console.error("Token validation error:", err);
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token]);

  // ✅ Redirect saat token invalid
  useEffect(() => {
    if (tokenValid === false) {
      router.push("/auth/signin?error=token_expired"); // Redirect ke login jika token expired
    }
  }, [tokenValid, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // PERBAIKAN 3: Gunakan apiClient.post
      // Endpoint: /api/auth/password-reset/confirm
      await apiClient.post("/auth/password-reset/confirm", {
        token,
        newPassword: password
      });

      // Sukses -> Redirect ke Login
      router.push("/auth/signin?success=password_reset");
      
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to reset password.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Loading saat token masih dicek
  if (tokenValid === null) {
    return (
      <div className="text-center mt-10">Validating reset link...</div>
    );
  }

  if (tokenValid === false) return null;

  return (
    <>
      <h2 className="text-center text-3xl font-semibold mb-2 text-[#5A4FB5] dark:text-[#9083F5]">Set new password</h2>
      <p className={`text-center mt-1 text-xs ${isDark ? "text-gray-200" : "text-gray-600"} mb-6`}>
        Enter your new password below to complete the reset process. Ensure it’s strong and secure
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <InputWithLabel
          label="New Password"
          type="password"
          name="password"
          required
          placeholder="Enter new password"
          value={password} // Tambahkan value agar controlled input
          onChange={(e) => setPassword(e.target.value)}
        />
        <InputWithLabel
          label="Confirm Password"
          type="password"
          name="confirm"
          required
          placeholder="Re-enter your password"
          value={confirm} // Tambahkan value agar controlled input
          onChange={(e) => setConfirm(e.target.value)}
        />
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6A5FDB] hover:bg-[#7E72E5] transition-all text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <div className="flex justify-center mt-4">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 text-xs text-[#5A4FB5] dark:text-[#9083F5] hover:underline"
        >
          <HiArrowLongLeft className="w-4 h-4" />
          Back to Log In
        </Link>
      </div>
    </>
  );
}

// PERBAIKAN 4: Bungkus dengan Suspense (Wajib di Next.js 13+ App Router saat pakai useSearchParams)
export default function ResetPasswordPage() {
  return (
    <AuthLayout branding={false}>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}