"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LabelList,
  Sector
} from "recharts";
import {
  Banknote, CreditCard, Signal, TrendingUp, TrendingDown,
  CircleCheck, CircleX, Globe, UsersRound, Filter,
  CalendarRange, Loader2, X, Calendar, User, Download, FileText, FileSpreadsheet,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import toast from "react-hot-toast";

// --- CUSTOM X-AXIS TICK COMPONENT (Two Lines) ---
const CustomAxisTick = (props: any) => {
  const { x, y, payload } = props;
  
  // Data from backend format: "Jan 2025"
  // Split into ["Jan", "2025"]
  const [month, year] = payload.value.split(" ");

  return (
    <g transform={`translate(${x},${y + 10})`}>
      <text x={0} y={0} dy={0} textAnchor="middle" fill="#9CA3AF" fontSize={10}>
        {/* Line 1: Month (Slightly bold) */}
        <tspan x="0" dy="0" fontWeight="600" fill="#4B5563">
            {month}
        </tspan>
        {/* Line 2: Year (Offset 12px down) */}
        <tspan x="0" dy="12" fontSize={9}>
            {year}
        </tspan>
      </text>
    </g>
  );
};

// --- 1. SKELETON COMPONENT (Helper) ---
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`} />
);

// --- 2. DATA TYPES ---
interface FilterState {
  picId: string;
  status: string;
  source: string;
  period: 'daily' | 'monthly' | 'quarterly' | 'custom' | '';
  startDate: string;
  endDate: string;
}

interface LeadChartItem {
  month: string;
  leads: number;
}

// --- 3. HELPER FUNCTIONS ---
const initialFilters: FilterState = {
  picId: "",
  status: "",
  source: "",
  period: '',
  startDate: "",
  endDate: ""
};

const getDatesForPeriod = (period: FilterState['period']) => {
  const now = new Date();
  let start = '';
  let end = new Date().toISOString().split('T')[0];

  if (period === 'daily') {
    start = end;
  } else if (period === 'monthly') {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  } else if (period === 'quarterly') {
    const month = now.getMonth();
    const quarterStartMonth = Math.floor(month / 3) * 3;
    start = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0];
  }
  
  return { startDate: start, endDate: end };
};

const formatIDR = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
};

// --- 4. MAIN DASHBOARD COMPONENT ---
export default function DashboardPage() {
  // Dashboard Data State
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  // State to track which bar is being hovered
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0); // State for hover effect

  // Tab State
  const [activeTab, setActiveTab] = useState("Meeting"); // Default 'Meeting'
  const router = useRouter();

  // Filters & Export State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [tempFilters, setTempFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // User Role State
  const [userRole, setUserRole] = useState<string | null>(null);

  // --- USE EFFECTS ---

  // Get role from localStorage on mount
  useEffect(() => {
      setUserRole(localStorage.getItem('role'));
  }, []);

  // Load Team Members
  useEffect(() => {
      const fetchTeam = async () => {
        try {
          const res = await apiClient.get("/team", { params: { limit: 1000 } }); 
          setTeamMembers(res.data.data || []); 
        } catch (err) {
          console.error("Failed to load team:", err);
          setTeamMembers([]); 
        }
      };
      fetchTeam();
  }, []);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const params: any = {};
        if (appliedFilters.picId) params.picId = appliedFilters.picId;
        if (appliedFilters.status) params.status = appliedFilters.status;
        if (appliedFilters.source) params.source = appliedFilters.source;
        if (appliedFilters.startDate) params.startDate = appliedFilters.startDate;
        if (appliedFilters.endDate) params.endDate = appliedFilters.endDate;

        const [metricsRes, chartsRes] = await Promise.all([
          apiClient.get("/dashboard/metrics", { params }),
          apiClient.get("/dashboard/charts", { params }),
        ]);

        setMetrics(metricsRes.data.data);
        setCharts(chartsRes.data.data);
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [appliedFilters]);

  // --- HANDLERS ---

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  // Helper function for dynamic period label
  const getPeriodLabel = () => {
    const { period, startDate, endDate } = appliedFilters;

    if (period === 'monthly') return "Showing data from current month";
    if (period === 'quarterly') return "Showing data from this quarter";
    if (period === 'daily') return "Showing data from today";
    
    if (period === 'custom' && startDate && endDate) {
      return `Showing data from ${new Date(startDate).toLocaleDateString('id-ID')} to ${new Date(endDate).toLocaleDateString('id-ID')}`;
    }
    
    // Default: All time data
    return "Showing all time data";
  };

  const handleApplyFilter = () => {
    let finalFilters = { ...tempFilters };
    if (finalFilters.period !== 'custom') {
        const { startDate, endDate } = getDatesForPeriod(finalFilters.period);
        finalFilters.startDate = startDate;
        finalFilters.endDate = endDate;
    }
    if (!finalFilters.period) {
        finalFilters.startDate = '';
        finalFilters.endDate = '';
    }
    setAppliedFilters(finalFilters);
    setIsFilterOpen(false);
  };

  const handleResetFilter = () => {
    setTempFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setIsFilterOpen(false);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      params.append('format', format);
      if (appliedFilters.picId) params.append('picId', appliedFilters.picId);
      if (appliedFilters.status) params.append('status', appliedFilters.status);
      if (appliedFilters.startDate) params.append('startDate', appliedFilters.startDate);
      if (appliedFilters.endDate) params.append('endDate', appliedFilters.endDate);

      const response = await apiClient.get(`/dashboard/export?${params.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'csv' ? 'csv' : 'pdf';
      link.setAttribute('download', `CRM_Report_${new Date().toISOString().split('T')[0]}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setIsExportOpen(false);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to download report.");
    } finally {
      setIsExporting(false);
      setIsExportOpen(false);
    }
  };

  // --- CHART DATA PREPARATION ---
  const leadsData: LeadChartItem[] = charts?.leadsByMonth?.map((item: any) => ({
    month: item.month,
    leads: Number(item.count),
  })) || [];

  const revenueData = charts?.revenueTrend?.length > 0 ? charts.revenueTrend : [
    { month: 'No Data', estimation: 0, realisation: 0 }
  ];

  const pieData = charts?.sourceBreakdown?.map((item: any) => ({
    name: item.name,
    value: Number(item.value)
  })) || [];

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };
  
  // Reset state when mouse leaves chart area
  const onPieLeave = () => {
    setActiveIndex(-1); // -1 means no slice is active (back to normal)
  };

  const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8} // Membesar 8px (lebih halus)
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        // Tambahkan shadow halus agar terlihat "mengambang"
        style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.2))" }}
      />
    </g>
  );
};

  const PIE_COLORS = [
    "#374151", // Dark Gray (Unknown/Others)
    "#9CA3AF", // Medium Gray (Ads)
    "#D1D5DB", // Light Gray (Referral)
    "#A78BFA", // Light Purple (Social Media)
    "#5A4FB5"  // Primary Purple (Website)
  ];

  // --- RENDER STATIC LABEL (Fixed Position) ---
  // We don't use 'outerRadius' from props because it changes on hover.
  // We hardcode base radius so the label stays in place.
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
  
    // Calculate label position (slightly outside the slice center)
    const radius = innerRadius + (outerRadius - innerRadius) * 1.6; 
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show if percentage > 5%
    if (percent < 0.05) return null;

    return (
      <g style={{ pointerEvents: 'none' }}>
        {/* Shadow for 3D effect */}
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* White Capsule Background */}
        <rect 
          x={x - 22} 
          y={y - 12} 
          width="44" 
          height="24" 
          rx="12" 
          ry="12" 
          fill="white" 
          filter="url(#shadow)"
        />
      
        {/* Percentage Text */}
        <text 
          x={x} 
          y={y} 
          dy={5} 
          textAnchor="middle" 
          fill="#111827" 
          fontSize={12} 
          fontWeight="bold"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  // Widget Data State
  const [widgetsData, setWidgetsData] = useState<any>({
    recentDeals: [],
    pipelineOverview: [],
    quarterSummary: { 
    totalWon: 0, 
    avgDealSize: 0, 
    pipelineValue: 0, 
    label: "Current Q" // Default placeholder
    },
    // Upcoming Activities Data
    upcomingActivities: {
        meetings: [],
        calls: [],
        emails: [],
        invoices: []
    }
});

  // Fetch Widget Data
  useEffect(() => {
    async function fetchWidgets() {
      try {
        // Build query params based on active filters
    const query = new URLSearchParams({ 
          picId: appliedFilters.picId || "" 
        }).toString();
            
        const res = await apiClient.get(`/dashboard/widgets?${query}`);
        const json = res.data; 
        if (json.success) {
          setWidgetsData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch widgets:", err);
      }
    }
    fetchWidgets();
  }, [appliedFilters]); // Re-fetch when filters change

  return (
    <div className="h-full overflow-y-auto p-2 no-scrollbar">
      <div className="space-y-4 animate-fadeIn pb-20">

        {/* HEADER DASHBOARD */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-[#2E2E2E] dark:text-white py-2">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getPeriodLabel()}
            </p>
          </div>

          <div className="flex gap-3">
            {/* EXPORT BUTTON */}
            <div className="relative" ref={exportRef}>
              <button 
                onClick={() => setIsExportOpen(!isExportOpen)}
                disabled={isExporting}
                className="flex items-center gap-2 border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isExporting ? "Exporting..." : "Export"}
              </button>
              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#2C2C2C] rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-green-600"/> Export CSV
                  </button>
                  <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                    <FileText size={16} className="text-red-600"/> Export PDF
                  </button>
                </div>
              )}
            </div>

            {/* FILTER BUTTON */}
            <div className="relative" ref={filterRef}>
              <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm transition font-medium ${isFilterOpen ? 'bg-[#5A4FB5] text-white border-[#5A4FB5]' : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200'}`}
              >
                <Filter size={16} /> Filters
                {(appliedFilters.status || appliedFilters.picId || appliedFilters.source) && (
                   <span className="flex h-2 w-2 rounded-full bg-red-500 -ml-1"></span>
                )}
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filter Data Dashboard</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* 1. GLOBAL DATE FILTER (PERIODE) */}
                      <div>
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Time Period</label>
                          
                          {/* Pilihan Cepat (Pills) */}
                          <div className="grid grid-cols-3 gap-2 mb-3">
                              {['', 'monthly', 'quarterly', 'daily'].map(p => (
                                  <button 
                                    key={p} 
                                    onClick={() => handleFilterChange('period', p as any)} 
                                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all ${
                                      tempFilters.period === p 
                                        ? 'bg-[#5A4FB5]/10 border-[#5A4FB5] text-[#5A4FB5]' 
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                    {/* Logic Label Tombol */}
                                    {p === '' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
                                  </button>
                              ))}
                          </div>

                          {/* Tombol Custom Range */}
                          <button 
                            onClick={() => handleFilterChange('period', 'custom')}
                            className={`w-full py-1.5 text-xs font-medium rounded-lg border mb-2 transition-all ${
                              tempFilters.period === 'custom'
                                ? 'bg-[#5A4FB5]/10 border-[#5A4FB5] text-[#5A4FB5]' 
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600 dark:text-gray-300'
                            }`}
                          >
                            Custom Range
                          </button>
                          
                          {/* Input Tanggal (Hanya muncul jika Custom) */}
                          {tempFilters.period === 'custom' && (
                              <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg animate-in slide-in-from-top-2">
                                  <div className="w-1/2">
                                    <span className="text-[10px] text-gray-500 block mb-1">Start</span>
                                    <input type="date" value={tempFilters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="w-full text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 dark:text-white focus:outline-none focus:border-[#5A4FB5]" />
                                  </div>
                                  <div className="w-1/2">
                                    <span className="text-[10px] text-gray-500 block mb-1">End</span>
                                    <input type="date" value={tempFilters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="w-full text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 dark:text-white focus:outline-none focus:border-[#5A4FB5]" />
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                      {/* 2. SPECIFIC FILTERS (PIC, STATUS, SOURCE) */}
                      <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Dimensions</label>
                        
                        <div className="space-y-3">
                          {/* PIC Filter */}
                          {userRole === 'ADMIN' && (
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">Sales Person (PIC)</label>
                            <select className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white focus:ring-1 focus:ring-[#5A4FB5] focus:outline-none" value={tempFilters.picId} onChange={(e) => handleFilterChange('picId', e.target.value)}>
                                <option value="">All Sales Team</option>
                                {teamMembers.map((member: any) => (
                                    <option key={member.id} value={member.id}>{member.fullName}</option>
                                ))}
                            </select>
                          </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                              {/* Status Filter */}
                              <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">Status</label>
                                <select className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white focus:ring-1 focus:ring-[#5A4FB5] focus:outline-none" value={tempFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                                    <option value="">All Status</option>
                                    <option value="WON">WON</option>
                                    <option value="LOST">LOST</option>
                                    <option value="ACTIVE">ACTIVE</option>
                                </select>
                              </div>
                              {/* Source Filter */}
                              <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">Source</label>
                                <select className="w-full px-2 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg dark:text-white focus:ring-1 focus:ring-[#5A4FB5] focus:outline-none" value={tempFilters.source} onChange={(e) => handleFilterChange('source', e.target.value)}>
                                    <option value="">All Sources</option>
                                    <option value="Website">Website</option>
                                    <option value="Ads">Ads</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Social Media">Social Media</option>
                                </select>
                              </div>
                          </div>
                        </div>
                      </div>

                      {/* 3. ACTION BUTTONS */}
                      <div className="flex gap-3 pt-2">
                          <button 
                            onClick={handleResetFilter} 
                            className="flex-1 py-2 text-sm font-medium border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-white transition"
                          >
                            Reset
                          </button>
                          <button 
                            onClick={handleApplyFilter} 
                            className="flex-1 py-2 text-sm font-medium bg-[#5A4FB5] text-white rounded-lg hover:bg-[#483D9B] transition shadow-sm"
                          >
                            Apply Filters
                          </button>
                      </div>
                  </div>
                </div>
              )}
            </div>
            </div>
            </div>

        {/* KPI CARDS WITH SKELETON */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {/* Total Pipeline */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
            <div className="flex justify-center items-center gap-2 text-black dark:text-gray-200 text-sm">
              <Banknote size={18} /> Total Pipeline Value
            </div>
            {isLoading ? (
               <Skeleton className="h-8 w-32 mx-auto mt-2" />
            ) : (
               <h2 className="text-2xl font-semibold mt-2 text-center dark:text-white">{formatIDR(metrics?.pipelineValue?.value || 0)}</h2>
            )}
            <div className="flex justify-center mt-2">
               {isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <div className={`flex items-center gap-1 text-sm ${metrics?.pipelineValue?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics?.pipelineValue?.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{metrics?.pipelineValue?.growth}%</span>
                  </div>
               )}
            </div>
          </div>

          {/* Active Deals */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
            <div className="flex justify-center items-center gap-2 text-black dark:text-gray-200 text-sm">
              <CreditCard size={18} /> Active Deals
            </div>
            {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-2" /> : (
               <h2 className="text-2xl font-semibold mt-2 text-center dark:text-white">{metrics?.activeDeals?.count || 0}</h2>
            )}
            <div className="flex justify-center mt-2">
               {isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <div className={`flex items-center gap-1 text-sm ${metrics?.activeDeals?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics?.activeDeals?.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{metrics?.activeDeals?.growth}%</span>
                  </div>
               )}
            </div>
          </div>

          {/* Average Deals */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
            <div className="flex justify-center items-center gap-2 text-black dark:text-gray-200 text-sm">
              <Signal size={18} /> Average Deals
            </div>
            {isLoading ? <Skeleton className="h-8 w-32 mx-auto mt-2" /> : (
               <h2 className="text-2xl font-semibold mt-2 text-center dark:text-white">{formatIDR(metrics?.avgDealSize?.value || 0)}</h2>
            )}
            <div className="flex justify-center mt-2">
               {isLoading ? <Skeleton className="h-4 w-16" /> : (
                  <div className={`flex items-center gap-1 text-xs ${metrics?.avgDealSize?.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {metrics?.avgDealSize?.growth >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{metrics?.avgDealSize?.growth}%</span>
                  </div>
               )}
            </div>
          </div>
        </div>

        {/* SUB KPI */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-hidden">
            {[
              { label: "Total Won", icon: <CircleCheck size={14} />, value: metrics?.totalWon?.count, growth: metrics?.totalWon?.growth },
              { label: "Total Lost", icon: <CircleX size={14} />, value: metrics?.totalLost?.count, growth: metrics?.totalLost?.growth },
              { label: "Total Leads", icon: <Globe size={14} />, value: metrics?.totalLeads?.count, growth: metrics?.totalLeads?.growth },
              { label: "Active Leads", icon: <UsersRound size={14} />, value: metrics?.activeDeals?.count, growth: metrics?.activeDeals?.growth }
            ].map((item, idx) => (
              <div key={idx} className={`flex items-center h-full px-3 md:px-6 py-3 md:py-4 flex-wrap md:flex-nowrap ${idx !== 3 ? "border-r md:border-r dark:border-gray-700" : ""} ${idx === 1 || idx === 3 ? "" : ""}`}>
                <span className="text-gray-800 dark:text-white mr-3">{item.icon}</span>
                    <span className="text-xs font-medium text-black dark:text-white mr-3">{item.label}</span>
                    {isLoading ? <Skeleton className="h-5 w-10 mt-1" /> : (
                    <>
                    <span className="text-xl font-semibold text-gray-900 dark:text-white mr-3">{item.value ?? 0}</span>
                    <div className={`flex items-center text-xs ${(item.growth || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {/* Logic Icon Panah Growth */}
                              {(item.growth || 0) >= 0 ? (
                                <TrendingUp size={14} className="mr-1 text-green-600" />
                              ) : (
                                <TrendingDown size={14} className="mr-1 text-red-600" />
                              )}

                              {/* Nilai Persentase */}
                              <span>
                                {(item.growth || 0) > 0 ? "+" : ""}
                                {item.growth}%
                              </span>
                           </div>
                  </>
                )}
              </div>
            ))}
            </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* LEFT COL */}
          <div className="lg:col-span-2 flex flex-col gap-4 md:gap-6">
            
            {/* Total Leads Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 pl-1 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="font-semibold mb-4 text-center text-gray-800 dark:text-white">Total Leads by Months</h3>
              <div className="h-64">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsData} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke=""  />
                      
                      <XAxis 
                        dataKey="month" 
                        tickLine={false} 
                        axisLine={false} 
                        fontSize={11} 
                        stroke="#9CA3AF" 
                        dy={10} 
                        interval={0}         // Force all labels to show
                        tick={<CustomAxisTick />} // Replace default tick with custom component
                        height={40}
                      />
                      
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        fontSize={11} 
                        stroke="#9CA3AF" 
                        width={60}
                      />

                      <Bar 
                        dataKey="leads" 
                        fill="#5A4FB5" 
                        radius={[4, 4, 4, 4]} 
                        barSize={40} // Wider bar so numbers fit
                        activeBar={false} // Disable default highlight
                        
                        // HOVER LOGIC: Set index on mouse enter/leave
                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Custom LabelList */}
                        <LabelList 
                          dataKey="leads" 
                          content={(props: any) => {
                            const { x, y, width, value, index } = props;
                            
                            // ONLY RENDER IF INDEX MATCHES (BEING HOVERED)
                            if (index !== hoveredIndex) return null;

                            return (
                              <text 
                                x={x + width / 2} // Position X: Center of bar
                                y={y + 20}        // Position Y: +20 means DOWN inside the bar (Inside Top)
                                fill="#FFFFFF"    // White text color (contrast with purple bar)
                                textAnchor="middle" 
                                fontSize={12} 
                                fontWeight="bold"
                                style={{ pointerEvents: 'none' }} // Don't interfere with mouse events
                              >
                                {value}
                              </text>
                            );
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 pl-1 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="text-center text-lg font-semibold mb-6 text-gray-800 dark:text-white">Estimation Revenue by Months</h3>
              <div className="h-64">
                  {isLoading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {/* Gradient for Estimation (Dark Line) */}
                        <linearGradient id="colorEst" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#374151" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#374151" stopOpacity={0}/>
                        </linearGradient>
                        {/* Gradient for Realisation (Light Line) */}
                        <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}/>
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10} 
                        interval={0}         // Force all labels to show
                        tick={<CustomAxisTick />} // Replace default tick with custom component
                        height={40}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                        tickFormatter={(value) => `${value / 1000000}M`} // Shorten million numbers
                        width={60}
                      />
                      
                      <Tooltip 
                        formatter={(value: number) => formatIDR(value)}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      />

                      {/* Area 1: Estimation (Back/Top Layer) */}
                      <Area 
                        type="monotone" // Smooth curve
                        dataKey="estimation" 
                        stroke="#374151" // Dark Gray/Black
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorEst)" 
                      />

                      {/* Area 2: Realisation (Front/Bottom Layer) */}
                      <Area 
                        type="monotone" 
                        dataKey="realisation" 
                        stroke="#9CA3AF" // Light Gray
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorReal)" 
                      />
                    </AreaChart>
                      </ResponsiveContainer>
                  )}
              </div>
              <div className="flex gap-8 mt-6 justify-center">
                <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-gray-700" /><p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Estimation</p></div>
                <div className="flex items-center gap-2"><span className="w-3.5 h-3.5 rounded-full bg-gray-400" /><p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Realisation</p></div>
              </div>
            </div>
          </div>

          {/* RIGHT COL */}
          <div className="flex flex-col gap-6">
            
            {/* UPCOMING ACTIVITIES WIDGET */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 h-full flex flex-col">
              
              <h3 className="text-center text-base font-semibold mb-4 text-gray-800 dark:text-white">Upcoming Activities</h3>
              
              {/* 1. TABS SWITCHER */}
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4">
                {["Meeting", "Call", "Email", "Invoice"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                      activeTab === tab
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" // Active Style
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400" // Inactive Style
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 2. ACTIVITY LIST */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
                {isLoading ? (
                   <>
                     <Skeleton className="h-16 w-full rounded-xl" />
                     <Skeleton className="h-16 w-full rounded-xl" />
                   </>
                ) : (
                  <>
                  {(() => {
                        // DATA SELECTOR LOGIC BASED ON TAB
                        let listData = [];
                        let type = ""; // Helper for styling

                        switch(activeTab) {
                            case "Meeting": 
                                listData = widgetsData?.upcomingActivities?.meetings || [];
                                type = "meeting";
                                break;
                            case "Call": 
                                listData = widgetsData?.upcomingActivities?.calls || [];
                                type = "call";
                                break;
                            case "Email": 
                                listData = widgetsData?.upcomingActivities?.emails || [];
                                type = "email";
                                break;
                            case "Invoice": 
                                listData = widgetsData?.upcomingActivities?.invoices || [];
                                type = "invoice";
                                break;
                        }

                        if (listData.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center h-40 text-center">
                                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-full mb-2">
                                   <CalendarRange size={24} className="text-gray-300" />
                                </div>
                                <p className="text-xs text-gray-400">No upcoming {activeTab.toLowerCase()}.</p>
                              </div>
                            );
                        }

                        // RENDER LOOP
                        return listData.map((item: any) => {
                            // Determine Data Fields (varies per table)
                            let title = "", subtitle = "", time: string | null = "", date = "";
                            
                            if (type === 'meeting') {
                                title = item.title || "Untitled Meeting";
                                subtitle = item.lead?.contact?.name ? `With: ${item.lead.contact.name}` : "No Contact";
                                date = item.startTime;
                                time = item.startTime;
                            } else if (type === 'call') {
                                title = "Scheduled Call";
                                subtitle = item.lead?.contact?.name ? `Call: ${item.lead.contact.name}` : "No Contact";
                                date = item.callTime;
                                time = item.callTime;
                            } else if (type === 'email') {
                                title = "Scheduled Email";
                                subtitle = item.lead?.contact?.name ? `To: ${item.lead.contact.name}` : "No Contact";
                                date = item.scheduledAt;
                                time = item.scheduledAt;
                            } else if (type === 'invoice') {
                                title = item.invoiceNumber || "Invoice";
                                subtitle = `Amount: ${formatIDR(item.totalAmount)}`;
                                date = item.dueDate; // Invoice only has date
                                time = null; // No specific time
                            }
                    return (
                                <div key={item.id} className="group flex flex-col bg-gray-50 dark:bg-gray-800/50 hover:bg-white hover:shadow-md dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 rounded-xl p-3 transition-all duration-200 cursor-pointer">
                                  
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                       <h4 className="font-semibold text-sm text-gray-900 dark:text-white group-hover:text-[#5A4FB5] transition-colors line-clamp-1">
                                         {title}
                                       </h4>
                                       <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                         {subtitle}
                                       </p>
                                    </div>
                                    {time && (
                                        <span className="bg-white border border-gray-200 dark:border-gray-600 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">
                                          {new Date(time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2 mt-1">
                                     <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                     </div>
                                     {/* Tampilkan Owner/PIC jika ada */}
                                     <div className="flex items-center gap-1 ml-auto">
                                        <User size={12} />
                                        {/* Fallback nama PIC */}
                                        {item.organizer?.fullName || item.user?.fullName || "Sales Team"}
                                     </div>
                                  </div>
                                </div>
                            );
                        });
                    })()}
                  </>
                )}
              </div>

              <button
                className="mt-4 w-full py-2.5 bg-[#5A4FB5] hover:bg-[#4a409c] dark:bg-gray-700 text-white rounded-xl text-xs font-semibold dark:hover:bg-gray-600 transition shadow-sm"
                onClick={() => {
                  // Ambil listData sesuai tab aktif
                  let listData = [];
                  switch(activeTab) {
                    case "Meeting":
                      listData = widgetsData?.upcomingActivities?.meetings || [];
                      break;
                    case "Call":
                      listData = widgetsData?.upcomingActivities?.calls || [];
                      break;
                    case "Email":
                      listData = widgetsData?.upcomingActivities?.emails || [];
                      break;
                    case "Invoice":
                      listData = widgetsData?.upcomingActivities?.invoices || [];
                      break;
                  }
                  // Debug log
                  if (listData.length === 1) {
                    let leadId = listData[0]?.lead?.id || listData[0]?.leadId || listData[0]?.id;
                    if (leadId) {
                      let tabParam = "";
                      if (activeTab === "Meeting") tabParam = "Meeting";
                      else if (activeTab === "Call") tabParam = "Call";
                      else if (activeTab === "Email") tabParam = "E-mail";
                      else if (activeTab === "Invoice") tabParam = "Invoice";
                      const url = `/lead/${leadId}?tab=${encodeURIComponent(tabParam)}`;
                      router.push(url);
                      return;
                    }
                  }
                  // Jika lebih dari satu item atau tidak ada leadId, redirect ke /lead
                  router.push("/lead");
                }}
              >
                View All {activeTab}s
              </button>
            </div>

            {/* Pie Chart: Lead Source */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
                <h3 className="text-center text-lg font-semibold mb-0 dark:text-white">Lead Source Breakdown</h3>
                <div className="h-[190px] w-full mt-3 flex items-center justify-center">
                    {isLoading ? <Skeleton className="w-full h-full rounded-full" /> : pieData.length === 0 ? (
                          <div className="text-gray-400 text-sm text-center">
                            No source data available.
                          </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                  activeIndex={activeIndex}
                                  activeShape={renderActiveShape} 
                                  data={pieData} 
                                  dataKey="value" 
                                  nameKey="name" 
                                  cx="50%" 
                                  cy="45%" 
                                  innerRadius={50} // Previously 60
                                  outerRadius={70}
                                  paddingAngle={3}
                                  stroke="none"
                                  
                                  // Label Config
                                  label={renderCustomLabel} 
                                  labelLine={false} 
                                  
                                  // Event Handlers
                                  onMouseEnter={onPieEnter}
                                  onMouseLeave={onPieLeave} // IMPORTANT: Reset on mouse leave
                                  animationDuration={400}
                                  animationBegin={0}
                                >
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                                          // Opacity Logic: Focus on active, dim others
                                          // If activeIndex is -1 (mouse leave), all opacity 1
                                          opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.3}
                                          style={{ transition: 'opacity 0.3s ease', outline: 'none' }}
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 mt-0 px-2">
                    {pieData.map((entry: any, index: number) => (
                        <div 
                          key={index} 
                          className={`flex items-center gap-2 transition-opacity ${
                            activeIndex === -1 || activeIndex === index ? 'opacity-100' : 'opacity-40'
                          }`}
                        >
                            {/* Titik Bulat Besar */}
                            <span 
                                className="w-3 h-3 rounded-full shadow-sm" 
                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                            ></span>
                            {/* Teks Legend */}
                            <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                              {entry.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>

        {/* --- BOTTOM SECTION: 3 COLUMNS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            
            {/* 1. RECENT DEALS (Left) */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 flex flex-col h-full">
                <div className="text-center mb-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Deals</h3>
                    <p className="text-xs text-gray-500">Your most recently updated deals</p>
                </div>

                <div className="flex-1 space-y-3">
                    {widgetsData.recentDeals.length > 0 ? widgetsData.recentDeals.map((deal: any, idx: number) => (
                        <div key={deal.id} className="flex justify-between items-center p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {deal.title || `Transaction ${idx + 1}`}
                            </p>
                            <p className="text-[10px] font-bold text-gray-900 dark:text-gray-300 mt-0.5">
                              {formatIDR(deal.value)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Status Badge Kecil */}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              deal.status === 'WON' ? 'bg-green-100 text-green-700' : 
                              deal.status === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {deal.status}
                            </span>
                            <button
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center"
                              onClick={() => {
                              // Try to get leadId from deal.leadId, deal.lead?.id, or deal.id
                              const leadId = deal.leadId || deal.lead?.id || deal.id;
                              if (leadId) {
                                router.push(`/lead/${leadId}`);
                              } else {
                                toast.error("No lead ID found for this deal.");
                              }
                              }}
                            >
                              View <ArrowRight size={12} className="ml-1"/>
                            </button>
                          </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-400 text-xs py-10">No recent deals</div>
                    )}
                </div>

                <button 
                  className="w-full mt-4 py-3 bg-[#5A4FB5] hover:bg-[#4a3f9a] text-white text-xs font-semibold rounded-xl transition"
                  onClick={() => router.push('/lead')}
                >
                  View All
                </button>
            </div>


            {/* 2. PIPELINE OVERVIEW (Center) */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 flex flex-col h-full">
                <div className="text-center mb-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pipeline Overview</h3>
                    <p className="text-xs text-gray-500">Distribution deals across stages</p>
                </div>

                <div className="flex-1 space-y-4">
                    {widgetsData.pipelineOverview.length > 0 ? widgetsData.pipelineOverview.map((item: any, idx: number) => (
                        <div key={idx} className="border border-gray-100 dark:border-gray-700 p-3 rounded-xl">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{item.stage}</span>
                                <span className="text-xs text-gray-500">{item.count} deals ({item.percentage}%)</span>
                            </div>
                            {/* Dark Progress Bar */}
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                <div 
                                    className="bg-[#333333] dark:bg-gray-400 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center text-gray-400 text-xs py-10">No active pipeline</div>
                    )}
                </div>

                <button 
                  className="w-full mt-4 py-3 bg-[#5A4FB5] hover:bg-[#4a3f9a] text-white text-xs font-semibold rounded-xl transition"
                  onClick={() => router.push('/lead')}
                >
                  View All
                </button>
            </div>


            {/* 3. RIGHT COLUMN (Pie Chart + Quarter Summary) */}
            <div className="flex flex-col gap-6">
                
                {/* A. LEAD SOURCE BREAKDOWN */}
                {/* Pie chart component is above */}
                {/* Container height should fit */}


                {/* B. QUARTER SUMMARY (New Widget) */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800">
                    <h3 className="text-base font-semibold text-center mb-4 text-gray-900 dark:text-white">Quarter Summary</h3>
                    
                    <div className="space-y-3">
                        {/* Card 1: Total Won */}
                        <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-black text-white p-2 rounded-lg">
                                    <CheckCircle size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatIDR(widgetsData.quarterSummary.totalWon)}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Total Won ({widgetsData.quarterSummary.label})</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Avg Deal Size */}
                        <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-black text-white p-2 rounded-lg">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatIDR(widgetsData.quarterSummary.avgDealSize)}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Avg Size ({widgetsData.quarterSummary.label})</p>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Active Pipeline */}
                        <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-700 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="bg-black text-white p-2 rounded-lg">
                                    <TrendingUp size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatIDR(widgetsData.quarterSummary.pipelineValue)}
                                    </p>
                                    <p className="text-[10px] text-gray-500">Pipeline ({widgetsData.quarterSummary.label})</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}