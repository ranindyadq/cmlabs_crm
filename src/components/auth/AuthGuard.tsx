"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  // 3 Status: sedang mengecek, boleh masuk, atau ditendang
  const [authStatus, setAuthStatus] = useState<"checking" | "authorized" | "unauthorized">("checking");

  useEffect(() => {
    // 1. Cek token di kedua tempat (Local & Session)
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      // Punya Karcis -> Silakan masuk
      setAuthStatus("authorized");
    } else {
      // Tidak Punya Karcis -> Dilarang masuk
      setAuthStatus("unauthorized");
      
      // 🚀 KUNCI PERBAIKAN: Gunakan window.location agar tidak nyangkut di Next.js Router
      window.location.replace("/auth/signin"); 
    }
  }, []);

  // 2. Tampilan saat Sedang Mengecek (Muncul Sepersekian Detik)
  if (authStatus === "checking") {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 text-[#5A4FB5] animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-medium animate-pulse">Checking authentication...</p>
      </div>
    );
  }

  // 3. Tampilan saat Dilarang Masuk (Sambil menunggu dipindah ke halaman Login)
  if (authStatus === "unauthorized") {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
        <p className="text-gray-500 text-sm font-medium animate-pulse">Session expired. Redirecting to login...</p>
      </div>
    );
  }

  // 4. Jika Sukses -> Tampilkan Layout Dashboard
  return <>{children}</>;
}