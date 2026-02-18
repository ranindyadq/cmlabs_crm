"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  List,
  Search,
  Sun,
  Moon,
  Home,
  Users,
  UserCircle,
  Globe,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  X
} from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";
import { SidebarProvider, useSidebar } from "@/lib/context/SidebarContext";
import NotificationBell from "@/components/ui/NotificationBell";
import apiClient from "@/lib/apiClient";
import AuthGuard from "@/components/auth/AuthGuard";

// --- DASHBOARD CONTENT COMPONENT ---
function DashboardContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  
  // 1. User state for dynamic data
  const [user, setUser] = useState({ 
    name: "User", 
    email: "user@cmlabs.co", 
    role: "", 
    photo: "" 
  });

  // 2. Fetch user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      // A. Check local data first (Optimistic UI)
      const localData = localStorage.getItem("user") || sessionStorage.getItem("user");
      
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setUser({
            name: parsed.name || parsed.fullName || "User",
            email: parsed.email || "user@cmlabs.co",
            role: parsed.role || "",
            photo: parsed.photo || ""
          });
        } catch (e) { 
          console.error("Parse error", e); 
        }
      }

      // B. Fetch latest data from server
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (token) {
          const res = await apiClient.get("/profile");
          const apiUser = res.data.data;

          // Clean role object if needed
          const roleName = typeof apiUser.role === 'object' && apiUser.role !== null 
            ? apiUser.role.name 
            : apiUser.role;

          // Update State UI
          setUser({
            name: apiUser.fullName || "User",
            email: apiUser.email || "user@cmlabs.co",
            role: roleName || "",
            photo: apiUser.photo || ""
          });

          // Prepare data for storage
          const storageData = {
            ...apiUser,
            role: roleName
          };

          // Smart storage: save user data in the same storage as token
          if (localStorage.getItem("token")) {
            localStorage.setItem("user", JSON.stringify(storageData));
          } else {
            sessionStorage.setItem("user", JSON.stringify(storageData));
          }
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      }
    };

    loadUserData();

    window.addEventListener("user-updated", loadUserData); 
    return () => window.removeEventListener("user-updated", loadUserData);
  }, []);
  
  // Sidebar Context
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  // State Search & User Menu
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Default company values
  const DEFAULT_COMPANY = {
    name: "cmlabs",
    tagline: "Level Up your SEO",
    logo: "/LOGO CRM 1.png"
  };

  const [companyInfo, setCompanyInfo] = useState(DEFAULT_COMPANY);

  // Fetch organization info
  const fetchOrgInfo = async () => {
    try {
      const res = await apiClient.get("/organization");
      const data = res.data.data;
      
      if (data) {
        setCompanyInfo({
          name: data.companyName || DEFAULT_COMPANY.name,
          tagline: data.tagline || DEFAULT_COMPANY.tagline,
          logo: data.logoUrl || DEFAULT_COMPANY.logo 
        });
      }
    } catch (err) {
      console.error("Failed to load company info, using defaults.", err);
      setCompanyInfo(DEFAULT_COMPANY);
    }
  };

  // Fetch org info on mount and listen for storage changes
  useEffect(() => {
    fetchOrgInfo();

    const handleStorageChange = () => {
      fetchOrgInfo();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Logic Handle Search
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim() !== "") {
      router.push(`/global-search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Close user menu when clicking outside
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

  // Close sidebar when route changes (mobile only)
  useEffect(() => {
    if (window.innerWidth < 768) {
      toggleSidebar(); // Close sidebar on mobile after navigation
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSidebarOpen]);

  // Handle logout
  const handleLogout = async () => {
    setIsUserMenuOpen(false);

    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout API failed", error);
    }

    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/auth/signin";
  };

  const navItems = [
    { 
      name: "Dashboard", 
      icon: Home, 
      href: "/dashboard", 
      roles: ["ADMIN", "SALES", "VIEWER"]
    },
    { 
      name: "Leads", 
      icon: Globe, 
      href: "/lead", 
      roles: ["ADMIN", "SALES"]
    },
    { 
      name: "Team", 
      icon: Users, 
      href: "/team", 
      roles: ["ADMIN"]
    },
    { 
      name: "Profile", 
      icon: UserCircle, 
      href: "/profile", 
      roles: ["ADMIN", "SALES", "VIEWER"] 
    },
  ];
  
  const filteredNavItems = navItems.filter(item => 
     item.roles.includes(user.role) || item.roles.includes("ALL")
  );

  const footerItems = [
    { name: "Get Help", icon: HelpCircle, href: "/help" },
    { name: "Setting", icon: Settings, href: "#" },
  ];

  return (
      <div className="h-screen flex bg-[#F0F2F5] dark:bg-[#2B265E] text-[#2E2E2E] p-2 sm:p-3 gap-2 sm:gap-3 lg:gap-5 overflow-hidden">
        
        {/* === MOBILE OVERLAY (Backdrop) === */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* === SIDEBAR === */}
        <aside 
          className={`
            bg-white dark:bg-[#3B3285] rounded-2xl flex flex-col justify-between shadow-lg overflow-hidden transition-all duration-300 ease-in-out z-50
            
            /* Mobile: Fixed sidebar (drawer from left) */
            fixed md:relative 
            top-2 bottom-2 left-2
            md:top-auto md:bottom-auto md:left-auto
            
            /* Width & Transform */
            ${isSidebarOpen 
              ? "w-64 px-4 py-5 translate-x-0" 
              : "w-64 px-4 py-5 -translate-x-[110%] md:translate-x-0 md:w-20 md:px-3 md:items-center"
            }
          `}
        >
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
            {/* === LOGO SECTION === */}
            <div className={`flex items-center gap-3 mb-6 sm:mb-8 transition-all duration-300 ${!isSidebarOpen ? "justify-center" : ""}`}>
              
              {/* Close button - Mobile only */}
              <button
                onClick={toggleSidebar}
                className="md:hidden absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Close sidebar"
              >
                <X size={18} className="text-gray-600 dark:text-gray-300" />
              </button>

              {/* Logo Image */}
              <div className="relative flex-shrink-0">
                <Image
                  src={companyInfo.logo} 
                  alt={`${companyInfo.name} Logo`}
                  width={isSidebarOpen ? 40 : 32}
                  height={isSidebarOpen ? 40 : 32}
                  className="object-contain transition-all duration-300 rounded-md"
                  priority 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/LOGO CRM 1.png";
                  }}
                />
              </div>
              
              {/* Logo Text */}
              <div 
                className={`flex flex-col overflow-hidden transition-all duration-300 ${
                  isSidebarOpen ? "opacity-100 max-w-[180px]" : "opacity-0 max-w-0 md:hidden"
                }`}
              >
                <h1 className="font-semibold text-base sm:text-lg leading-tight text-[#2E2E2E] dark:text-white truncate">
                  {companyInfo.name}
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                  {companyInfo.tagline}
                </p>
              </div>
            </div>

            {/* === NAVIGATION === */}
            <nav className="flex flex-col gap-1.5 sm:gap-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 768 && isSidebarOpen) {
                        toggleSidebar();
                      }
                    }}
                    className={`
                      flex items-center gap-3 py-2.5 sm:py-2 text-sm font-medium transition-all rounded-lg group
                      ${isSidebarOpen ? "pl-4 pr-3" : "justify-center px-0"}
                      ${isActive 
                        ? "bg-[#F0F2F5] dark:bg-[#2B265E] text-[#5A4FB5] shadow-sm" 
                        : "hover:bg-gray-50 dark:hover:bg-[#2B265E] text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      }
                    `}
                    title={!isSidebarOpen ? item.name : ""}
                  >
                    <Icon size={20} className={isActive ? "text-[#5A4FB5]" : ""} />
                    {isSidebarOpen && <span>{item.name}</span>}
                    
                    {/* Active indicator - only when collapsed */}
                    {!isSidebarOpen && isActive && (
                      <div className="absolute left-0 w-1 h-8 bg-[#5A4FB5] rounded-r-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* === FOOTER SIDEBAR === */}
          <div className={`flex flex-col gap-1.5 sm:gap-2 text-sm text-gray-700 dark:text-gray-300 pt-4 border-t border-gray-100 dark:border-gray-700 mt-4 ${isSidebarOpen ? "" : "items-center"}`}>
            {footerItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 hover:text-black dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2B265E] ${!isSidebarOpen && "justify-center"}`}
                  title={!isSidebarOpen ? item.name : ""}
                >
                  <Icon size={18} />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </aside>

        {/* === MAIN SECTION === */}
        <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 ">
          {/* === HEADER === */}
          <header className="flex justify-between items-center mb-3 sm:mb-4 flex-shrink-0 gap-2 sm:gap-3">
            
            {/* Left: Menu + Search */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              
              {/* Hamburger Menu Button */}
              <button 
                onClick={toggleSidebar}
                className="bg-white dark:bg-[#3B3285] p-2 sm:p-2.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#2B265E] transition-colors flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <List size={18} className="text-black dark:text-white" />
              </button>

              {/* Search Bar */}
              <div className="relative flex-1 min-w-0 max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-full border border-gray-300 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-[#5A4FB5]/20 focus:border-[#5A4FB5] bg-white dark:bg-[#3B3285] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearch}
                />
              </div>
            </div>

            {/* Right: Notifications + Theme + User */}
            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
              
              {/* Notification Bell */}
              <NotificationBell />

              {/* Theme Toggle - Hidden on small screens */}
              <div className="hidden sm:flex items-center bg-white dark:bg-gray-800 rounded-full p-1 border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => theme !== "light" && toggleTheme()}
                  className={`p-1.5 rounded-full transition-all ${
                    theme === "light" ? "bg-[#5A4FB5] text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  aria-label="Light mode"
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => theme !== "dark" && toggleTheme()}
                  className={`p-1.5 rounded-full transition-all ${
                    theme === "dark" ? "bg-[#5A4FB5] text-white shadow-sm" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  aria-label="Dark mode"
                >
                  <Moon size={16} />
                </button>
              </div>

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} 
                  className={`
                    flex items-center gap-2 sm:gap-3 pl-1 pr-2 sm:pr-3 py-1 rounded-full transition-all duration-200 border
                    ${isUserMenuOpen 
                      ? "bg-white dark:bg-[#2C2C2C] border-[#5A4FB5] dark:border-[#CAA9FF] shadow-md" 
                      : "bg-white dark:bg-[#3B3285] border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm"
                    }
                  `}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                >
                  {/* Avatar */}
                  <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#5A4FB5] text-white flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden flex-shrink-0">
                    {user.photo ? (
                      <Image 
                        src={user.photo} 
                        alt={user.name} 
                        fill 
                        sizes="32px"
                        className="object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {/* User Info - Hidden on mobile */}
                  <div className="hidden md:flex flex-col items-start text-left min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 leading-tight truncate max-w-[100px] lg:max-w-[150px]">
                      {user.name?.split(" ")[0] || "User"}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight truncate max-w-[100px] lg:max-w-[150px]">
                      {user.role || "Team"}
                    </span>
                  </div>

                  <ChevronDown 
                    size={14} 
                    className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      isUserMenuOpen ? "rotate-180 text-[#5A4FB5]" : ""
                    }`} 
                  />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    
                    {/* Profile Header */}
                    <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative w-10 h-10 rounded-full bg-[#5A4FB5] text-white flex items-center justify-center text-sm font-bold shadow-md overflow-hidden">
                          {user.photo ? (
                            <Image 
                              src={user.photo} 
                              alt={user.name} 
                              fill 
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      {/* Theme Toggle - Mobile only */}
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsUserMenuOpen(false);
                        }}
                        className="sm:hidden w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-left mb-1"
                      >
                        {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
                      </button>

                      {/* Logout */}
                      <button 
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left" 
                        onClick={handleLogout}
                      >
                        <LogOut size={18} /> 
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden rounded-2xl w-full">
            {children}
          </div>
        </main>
      </div>
  );
}

// Main layout wrapper with providers
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
        <AuthGuard>
          <DashboardContent>{children}</DashboardContent>
        </AuthGuard>
    </SidebarProvider>
  );
}