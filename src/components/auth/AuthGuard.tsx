"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 1. Cek Token di LocalStorage
    const token = localStorage.getItem("token");

    if (!token) {
      // 2. Jika tidak ada, tendang ke login
      router.replace("/auth/signin");
    } else {
      // 3. Jika ada, izinkan masuk
      setIsAuthorized(true);
    }
  }, [router]);

  // Tampilkan Loading selama pengecekan berlangsung
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-[#5A4FB5] animate-spin" />
      </div>
    );
  }

  // Render halaman asli jika lolos
  return <>{children}</>;
}