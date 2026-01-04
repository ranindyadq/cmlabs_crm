"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

// 1. Komponen Logic (Dibungkus Suspense nanti)
function HandleLoginProcess() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Ambil data dari URL
    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const name = searchParams.get("name");
    
    // Debugging di Console Browser
    console.log("🔍 Menerima Data Google:", { token, role, name });

    if (token) {
      // A. Simpan ke LocalStorage
      localStorage.setItem("token", token);
      if (role) localStorage.setItem("role", role);
      
      const userObj = { name: name || "User", email: "", role: role };
      localStorage.setItem("user", JSON.stringify(userObj));

      // B. Redirect ke Dashboard (Gunakan window.location agar refresh state penuh)
      console.log("✅ Login Sukses, mengalihkan ke Dashboard...");
      
      // Delay kecil 500ms agar storage sempat tertulis (dan user lihat loading sebentar)
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);

    } else {
      // JANGAN langsung redirect error dulu.
      // Next.js kadang butuh waktu milidetik untuk populate searchParams.
      // Biarkan user stay di loading screen, atau redirect manual jika benar-benar macet > 3 detik.
      console.log("⏳ Menunggu token terbaca...");
    }
  }, [searchParams, router]);

  // TAMPILAN SKELETON / LOADING
  // Ini yang akan dilihat user saat proses "di belakang layar"
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
        
        {/* Ikon Loading Berputar */}
        <Loader2 className="w-12 h-12 text-[#5A4FB5] animate-spin mb-4" />
        
        {/* Teks Status */}
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          Sedang masuk...
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Menyiapkan dashboard Anda
        </p>

        {/* Skeleton Bar (Pemanis Visual) */}
        <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-[#5A4FB5] animate-pulse w-2/3 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// 2. Export Utama dengan SUSPENSE
// Wajib pakai Suspense agar useSearchParams tidak error di Next.js App Router
export default function SocialCallbackPage() {
  return (
    <Suspense fallback={
        // Fallback jika Suspense belum siap (Sangat jarang muncul)
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
        </div>
    }>
      <HandleLoginProcess />
    </Suspense>
  );
}