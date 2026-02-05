"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useTheme } from "@/lib/context/ThemeContext";
import { HiArrowLongLeft } from "react-icons/hi2";
import { FaCheckCircle, FaLockOpen, FaHourglassEnd, FaExclamationTriangle } from "react-icons/fa";

function ResetStatusContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const state = searchParams.get("state");
  const email = searchParams.get("email"); 
  const isSuccess = state === "success";

  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <AuthLayout branding={false}>
      <div className="flex flex-col items-center justify-center text-center min-h-[80vh]">
      {/* Ikon Status */}
        <div
        className={`mx-auto mb-2 flex items-center justify-center w-[90px] h-[90px] rounded-full shadow-md ${
          isSuccess ? "bg-[#E5F9EE]" : "bg-[#F2F1FA]"
        }`}
      >
        {isSuccess ? (
          <FaCheckCircle className="w-10 h-10 text-[#257047]" />
        ) : (
          <FaHourglassEnd className="w-10 h-10 text-[#FFAB00]" />
        )}
      </div>

        {isSuccess ? (
          <>
            <h2 className="text-center text-3xl font-semibold mb-2 text-[#5A4FB5] dark:text-[#9083F5]">
              Your password has been successfully reset
            </h2>
            <p className={`text-center mt-1 text-xs ${isDark ? "text-gray-300" : "text-gray-600"} mb-6`}>
              You can log in with your new password. If you encounter any issues, please contact support !
            </p>
            <Link
              href="/auth/signin"
              className="w-full bg-[#5A4FB5] hover:bg-[#4e449d] transition-all text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 mb-3"
            >
              Login Now
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-center text-3xl font-semibold mb-2 text-[#5A4FB5] dark:text-[#9083F5]">Link Expired</h2>
            <p className={`text-center mt-1 text-xs ${isDark ? "text-gray-300" : "text-gray-600"} mb-6`}>
              The password reset link has expired. Please request a new link to reset your password.
            </p>
            <Link
              href="/auth/forgot-password"
              className="w-full bg-[#6A5FDB] hover:bg-[#7E72E5] transition-all text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-50 mb-3"
            >
              Request New Link
            </Link>
          </>
        )}

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
    </AuthLayout>
  );
}

export default function ResetStatusPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading status...</div>}>
      <ResetStatusContent />
    </Suspense>
  );
}
