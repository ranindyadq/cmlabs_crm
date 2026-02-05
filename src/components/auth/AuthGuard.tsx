"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // 🔍 CEK DI KEDUA SAKU
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      // Kosong melompong -> Usir
      router.replace("/auth/signin");
    } else {
      // Ada tiket -> Silakan masuk
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
    return null; // Atau return loading spinner
  }

  // Render halaman asli jika lolos
  return <>{children}</>;
}