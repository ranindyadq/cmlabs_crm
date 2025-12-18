"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Bell,
  List,
  Search,
  User,
  Sun,
  Moon,
  Home,
  Users,
  UserCircle,
  Globe,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";
import { SidebarProvider, useSidebar } from "@/lib/context/SidebarContext";
import NotificationBell from "@/components/ui/NotificationBell";
import { Suspense } from "react";
import apiClient from "@/lib/apiClient";
import DashboardSkeleton from "@/components/ui/DashboardSkeleton";

// --- KOMPONEN ISI LAYOUT (Logic Utama Disini) ---
// === 1. AUTH GUARD WRAPPER (Penjaga Pintu Utama) ===
function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Cek Token dari URL (Login Google)
    const urlToken = searchParams.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsAuthorized(true);
      return;
    }

    // Cek Token dari LocalStorage
    const token = localStorage.getItem("token");
    if (!token) {
      // Jika tidak ada token, tendang ke login
      router.replace("/auth/signin");
    } else {
      // Jika ada token, izinkan render
      setIsAuthorized(true);
    }
  }, [router, searchParams]);

  // 🔥 PENTING: JANGAN RENDER ANAKNYA JIKA BELUM AUTHORIZED
  // Ini mencegah NotificationBell jalan duluan sebelum token siap
  if (!isAuthorized) {
    return <DashboardSkeleton />;
  }

  return <>{children}</>;
}

// --- KOMPONEN ISI LAYOUT ---
function DashboardContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  // 1. TAMBAHKAN STATE USER UNTUK DATA DINAMIS
  const [user, setUser] = useState({ name: "User", email: "user@cmlabs.co", role: "" });

  // 2. FETCH DATA USER DARI LOCALSTORAGE SAAT MOUNT
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser({
          name: parsedUser.fullName || "User",
          email: parsedUser.email || "user@cmlabs.co",
          role: parsedUser.role || ""
        });
      } catch (e) {
        console.error("Gagal parse user data");
      }
    }
  }, []);
  
  // Sidebar Context
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  // State Search & User Menu
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // State Data Perusahaan
  const [companyInfo, setCompanyInfo] = useState({
    name: "cmlabs", // Langsung set default value
    tagline: "Level Up your SEO", // Langsung set default value
    logo: "/LOGO CRM 1.png" 
  });

  // Fetch Data Organization Profile
  useEffect(() => {
    const fetchOrgInfo = async () => {
      try {
        const res = await apiClient.get("/organization");
        const data = res.data.data;
        
        // Pastikan fallback aman jika data DB null
        setCompanyInfo({
          name: data?.companyName || "cmlabs",
          // Gunakan address atau tagline field jika sudah ditambahkan ke schema
          tagline: data?.addressLine1 ? "Level Up your SEO" : "Level Up your SEO", 
          // Pastikan field logoUrl ada di schema, atau gunakan default
          logo: data?.logoUrl || "/LOGO CRM 1.png" 
        });
      } catch (err) {
        console.error("Gagal load info company, menggunakan default.", err);
        // Fallback ke default cmlabs jika API gagal
        setCompanyInfo({
            name: "CRM cmlabs",
            tagline: "Level Up your SEO",
            logo: "/LOGO CRM 1.png"
        });
      }
    };
    
    fetchOrgInfo();
  }, []);

  // Logic Handle Search
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      router.push(`/global-search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Logic Click Outside Menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ✅ LOGIKA LOGOUT
  const handleLogout = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/auth/signin"; // Hard refresh
  };

  const navItems = [
    { name: "Dashboard", icon: Home, href: "/dashboard" },
    { name: "Leads", icon: Globe, href: "/lead" },
    { name: "Team", icon: Users, href: "/team" },
    { name: "Profile", icon: UserCircle, href: "/profile" },
  ];

  const footerItems = [
    { name: "Get Help", icon: HelpCircle, href: "#" },
    { name: "Setting", icon: Settings, href: "#" },
  ];

  return (
    <div className="h-screen flex bg-[#F5F6FA] dark:bg-[#2B265E] text-[#2E2E2E] p-3 gap-6 overflow-hidden">
      
      {/* === SIDEBAR === */}
      <aside 
        className={`
          bg-white dark:bg-[#3B3285] rounded-2xl flex flex-col justify-between py-5 shadow-md overflow-y-auto transition-all duration-300
          ${isSidebarOpen ? "w-64 px-5" : "w-20 px-3 items-center"} 
        `}
      >
        <div>
          {/* === LOGO SECTION (DINAMIS) === */}
          <div className={`flex items-center gap-3 mb-8 transition-all duration-300 ${!isSidebarOpen ? "justify-center" : "px-2"}`}>
            
            {/* 1. LOGO IMAGE */}
            <Image
              src={companyInfo.logo} 
              alt={`${companyInfo.name} Logo`}
              width={isSidebarOpen ? 40 : 32}
              height={isSidebarOpen ? 40 : 32}
              className="object-contain transition-all duration-300"
              priority // Tambahkan priority agar logo load cepat
            />
            
            {/* 2. TEKS LOGO */}
            <div 
              className={`flex flex-col overflow-hidden transition-all duration-300 ${
                isSidebarOpen ? "opacity-100 w-auto translate-x-0" : "opacity-0 w-0 -translate-x-5 hidden"
              }`}
            >
              <h1 className="font-semibold text-lg leading-tight text-[#2E2E2E] dark:text-white whitespace-nowrap truncate max-w-[150px]" title={companyInfo.name}>
                {companyInfo.name}
              </h1>
              
              <p className="text-[10px] text-gray-500 font-medium whitespace-nowrap truncate max-w-[150px]">
                {companyInfo.tagline}
              </p>
            </div>
          </div>

          {/* === NAVIGATION === */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-3 py-2 text-sm font-medium transition rounded-lg
                    ${isSidebarOpen ? "pl-5 pr-3 w-full" : "justify-center w-full px-0"}
                    ${isActive 
                      ? "bg-[#CAA9FF] text-[#2E2E2E]" 
                      : "hover:bg-gray-100 text-gray-700"
                    }
                  `}
                  title={!isSidebarOpen ? item.name : ""} // Tooltip saat tutup
                >
                  <Icon 
                    size={20} 
                    className={`${isActive ? "text-[#5A4FB5]" : "text-black dark:text-white"}`} 
                  />
                  
                  {/* Sembunyikan Nama Menu jika Sidebar Tutup */}
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* === FOOTER SIDEBAR === */}
        <div className={`flex flex-col gap-2 text-sm text-gray-700 ${isSidebarOpen ? "px-0" : "items-center"}`}>
          {footerItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 hover:text-black dark:text-white transition p-2 rounded-lg hover:bg-gray-50 ${!isSidebarOpen && "justify-center"}`}
                title={!isSidebarOpen ? item.name : ""}
              >
                <Icon size={18} className="text-black dark:text-white" />
                {isSidebarOpen && item.name}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* === MAIN SECTION === */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* === HEADER === */}
        <header className="flex justify-between items-center mb-6 flex-shrink-0">
          
          {/* Left: Menu + Search */}
          <div className="flex items-center gap-3 w-1/2">
            
            {/* TOMBOL HAMBURGER (Action Toggle) */}
            <button 
              onClick={toggleSidebar}
              className="bg-white dark:bg-[#3B3285] p-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition"
            >
              <List size={18} className="text-black dark:text-white" />
            </button>

          {/* SEARCH BAR */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-2.5 text-black dark:text-white" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-9 pr-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm focus:outline-none bg-white dark:bg-[#3B3285] text-black dark:text-white"
                
                // Logic Binding
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>
          </div>

          {/* RIGHT HEADER */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* Theme Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden">
              <button
                onClick={() => theme !== "light" && toggleTheme()}
                className={`w-7 h-7 flex items-center justify-center transition-colors ${
                  theme === "light" ? "bg-[#5A4FB5] text-white" : "text-black"
                }`}
              >
                <Sun size={14} />
              </button>
              <button
                onClick={() => theme !== "dark" && toggleTheme()}
                className={`w-7 h-7 flex items-center justify-center transition-colors ${
                  theme === "dark" ? "bg-[#5A4FB5] text-white" : "text-black"
                }`}
              >
                <Moon size={14} />
              </button>
            </div>

            {/* === USER MENU DROPDOWN (YANG DIRAPIKAN) === */}
            <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  className={`
                    flex items-center gap-3 pl-1 pr-3 py-1 rounded-full transition-all duration-200 border
                    ${isUserMenuOpen 
                      ? "bg-white border-[#5A4FB5] shadow-sm dark:bg-[#2C2C2C] dark:border-[#CAA9FF]" 
                      : "bg-transparent border-transparent hover:bg-white/50 hover:border-gray-200 dark:hover:bg-white/10 dark:hover:border-gray-700"
                    }
                  `}
                >
                    {/* Avatar: Gunakan inisial nama */}
                    <div className="w-8 h-8 rounded-full bg-[#5A4FB5] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Nama User (Hidden di mobile) */}
                    <div className="hidden md:flex flex-col items-start text-left">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-tight">
                        {user.name?.split(" ")[0] || "User"} {/* Ambil nama depan saja biar rapi */}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                        {user.role || "Team"}
                      </span>
                    </div>

                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180 text-[#5A4FB5]" : ""}`} />
                </button>

                {/* Dropdown Content */}
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        
                        {/* Header Profile Info */}
                        <div className="px-5 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {user.email}
                            </p>
                        </div>

                        {/* Menu Links */}
                        <div className="p-2 space-y-1">
                            <Link 
                              href="/profile" 
                              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-[#5A4FB5] dark:hover:text-[#CAA9FF] rounded-xl transition-colors" 
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                                <UserCircle size={18} /> My Profile
                            </Link>
                            <Link 
                              href="/#" 
                              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-[#5A4FB5] dark:hover:text-[#CAA9FF] rounded-xl transition-colors" 
                              onClick={() => setIsUserMenuOpen(false)}
                            >
                                <Settings size={18} /> Account Settings
                            </Link>
                        </div>

                        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-2 my-1"></div>

                        {/* Logout */}
                        <div className="p-2">
                            <button 
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left" 
                              onClick={handleLogout}
                            >
                                <LogOut size={18} /> Log out
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

// WRAPPER UTAMA (Wajib ada Provider di luar Content)
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      {/* Gunakan Skeleton juga disini agar transisi sangat mulus */}
      <Suspense fallback={<DashboardSkeleton />}>
        <AuthGuard>
          <DashboardContent>{children}</DashboardContent>
        </AuthGuard>
      </Suspense>
    </SidebarProvider>
  );
}