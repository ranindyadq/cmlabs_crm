"use client";

import { useEffect, useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LabelList
} from "recharts";
import {
  Banknote, CreditCard, Signal, TrendingUp, TrendingDown,
  CircleCheck, CircleX, Globe, UsersRound, Filter,
  MapPin, CalendarRange, Check, Loader2, X, Calendar, User, Tag, Layers, Download, FileText, FileSpreadsheet
} from "lucide-react";
import apiClient from "@/lib/apiClient";

// --- 1. KOMPONEN SKELETON (Helper) ---
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`} />
);

// --- 2. TIPE DATA ---
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
  period: 'monthly',
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

// --- 4. KOMPONEN UTAMA DASHBOARD ---
export default function DashboardPage() {
  // State Dashboard Data
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // State Filters & Export
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [tempFilters, setTempFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- USE EFFECTS ---

  // 1. Load Team Members
  useEffect(() => {
      const fetchTeam = async () => {
        try {
          const res = await apiClient.get("/team", { params: { limit: 1000 } }); 
          setTeamMembers(res.data.data || []); 
        } catch (err) {
          console.error("Gagal load team:", err);
          setTeamMembers([]); 
        }
      };
      fetchTeam();
  }, []);

  // 2. Click Outside Handler
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

  // 3. Fetch Dashboard Data
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

        const [metricsRes, chartsRes, summaryRes] = await Promise.all([
          apiClient.get("/dashboard/metrics", { params }),
          apiClient.get("/dashboard/charts", { params }),
          apiClient.get("/dashboard/summary", { params }),
        ]);

        setMetrics(metricsRes.data.data);
        setCharts(chartsRes.data.data);
        setSummary(summaryRes.data.data);
      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
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
      console.error("Gagal export:", error);
      alert("Gagal mengunduh laporan.");
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

  const PIE_COLORS = ["#7D7D7D", "#B3B3B3", "#8C74FF", "#4A4A4A", "#D9D9D9", "#5A4FB5"];

  return (
    <div className="h-full overflow-y-auto p-6 scrollbar-hide">
      <div className="space-y-6 animate-fadeIn pb-20">

        {/* HEADER DASHBOARD */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-[#2E2E2E] dark:text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing data from current month
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
              </button>
              
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#2C2C2C] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filter Data Dashboard</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={16} /></button>
                  </div>
                  
                  <div className="space-y-4">
                      {/* Period Filter */}
                      <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">Periode</label>
                          <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-lg">
                              {['monthly', 'quarterly', 'custom'].map(p => (
                                  <button key={p} onClick={() => handleFilterChange('period', p as any)} className={`flex-1 py-1 text-xs font-medium rounded-md ${tempFilters.period === p ? 'bg-[#5A4FB5] text-white' : 'text-gray-600'}`}>{p}</button>
                              ))}
                          </div>
                      </div>
                      
                      {/* Date Range */}
                      {tempFilters.period === 'custom' && (
                          <div className="flex gap-2">
                              <input type="date" value={tempFilters.startDate} onChange={(e) => handleFilterChange('startDate', e.target.value)} className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-800 dark:text-white" />
                              <input type="date" value={tempFilters.endDate} onChange={(e) => handleFilterChange('endDate', e.target.value)} className="w-full px-2 py-1 text-xs border rounded dark:bg-gray-800 dark:text-white" />
                          </div>
                      )}

                      {/* PIC Filter */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">PIC</label>
                        <select className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg dark:text-white" value={tempFilters.picId} onChange={(e) => handleFilterChange('picId', e.target.value)}>
                            <option value="">Semua PIC</option>
                            {teamMembers.map((member: any) => (
                                <option key={member.id} value={member.id}>{member.fullName}</option>
                            ))}
                        </select>
                      </div>

                      {/* Status & Source Filter */}
                      <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                            <select className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg dark:text-white" value={tempFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
                                <option value="">All</option>
                                <option value="WON">WON</option>
                                <option value="LOST">LOST</option>
                                <option value="ACTIVE">ACTIVE</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Source</label>
                            <select className="w-full p-2 text-sm bg-gray-50 dark:bg-gray-800 border rounded-lg dark:text-white" value={tempFilters.source} onChange={(e) => handleFilterChange('source', e.target.value)}>
                                <option value="">All</option>
                                <option value="Website">Website</option>
                                <option value="Ads">Ads</option>
                                <option value="Referral">Referral</option>
                            </select>
                          </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-4">
                          <button onClick={handleResetFilter} className="flex-1 py-2 text-sm border rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">Reset</button>
                          <button onClick={handleApplyFilter} className="flex-1 py-2 text-sm bg-[#5A4FB5] text-white rounded hover:bg-[#4a4194]">Apply</button>
                      </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI CARDS WITH SKELETON */}
        <div className="grid grid-cols-3 gap-5">
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
        <div className="grid grid-cols-4 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-md overflow-hidden">
            {[
              { label: "Total Won", icon: <CircleCheck size={14} />, value: metrics?.totalWon?.count, growth: metrics?.totalWon?.growth },
              { label: "Total Lost", icon: <CircleX size={14} />, value: metrics?.totalLost?.count, growth: metrics?.totalLost?.growth },
              { label: "Total Leads", icon: <Globe size={14} />, value: metrics?.totalLeads?.count, growth: metrics?.totalLeads?.growth },
              { label: "Active Leads", icon: <UsersRound size={14} />, value: metrics?.activeDeals?.count, growth: metrics?.activeDeals?.growth }
            ].map((item, idx) => (
              <div key={idx} className={`flex items-center gap-3 px-4 py-3 whitespace-nowrap ${idx !== 3 ? "border-r dark:border-gray-700" : ""}`}>
                <span className="text-gray-600 dark:text-gray-300">{item.icon}</span>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                    {isLoading ? <Skeleton className="h-5 w-10 mt-1" /> : (
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">{item.value ?? 0}</span>
                            <span className={`text-xs ${(item.growth || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>{Math.abs(item.growth || 0)}%</span>
                        </div>
                    )}
                </div>
              </div>
            ))}
        </div>

        {/* CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COL */}
          <div className="col-span-2 flex flex-col gap-6">
            
            {/* Total Leads Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="font-semibold mb-4 text-center text-gray-800 dark:text-white">Total Leads by Months</h3>
              <div className="h-64">
                {isLoading ? <Skeleton className="w-full h-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsData} barCategoryGap={20}>
                      <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#595959" />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#595959" />
                      <Tooltip cursor={false} contentStyle={{ borderRadius: "12px", border: "none" }} />
                      <Bar dataKey="leads" fill="#5A4FB5" activeBar={{ fill: "#40388A" }} radius={[6, 6, 0, 0]} onMouseEnter={(_data: any, index: number) => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} >
                        <LabelList dataKey="leads" content={(props) => {
                            if (!props || props.index !== hoveredIndex) return null;
                            return <text x={props.x} y={props.y} dy={4} textAnchor="middle" fill="#FFFFFF" fontSize={12} fontWeight={600}>{props.value}</text>;
                        }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="text-center text-lg font-semibold mb-6 text-gray-800 dark:text-white">Estimation Revenue by Months</h3>
              <div className="h-64">
                  {isLoading ? <Skeleton className="w-full h-full" /> : (
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="realisationGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#D1D5DB" stopOpacity={0.6}/>
                                      <stop offset="95%" stopColor="#F3F4F6" stopOpacity={0.3}/>
                                  </linearGradient>
                                  <linearGradient id="estimationGradient" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.4}/>
                                      <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0.1}/>
                                  </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" vertical={false} />
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 13 }} />
                              <Tooltip formatter={(value: number) => formatIDR(value)} />
                              <Area type="monotone" dataKey="realisation" stroke="#9CA3AF" strokeWidth={2} fill="url(#realisationGradient)" />
                              <Area type="monotone" dataKey="estimation" stroke="#374151" strokeWidth={2.5} fill="url(#estimationGradient)" />
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
            
            {/* Upcoming Activities */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="text-center text-base font-semibold mb-3 dark:text-white">Upcoming Activities</h3>
              <div className="flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : (
                    <>
                        {summary?.upcomingActivities?.meetings?.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">No upcoming meetings.</p>}
                        {summary?.upcomingActivities?.meetings?.map((meeting: any) => (
                            <div key={meeting.id} className="flex bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden mb-3 border dark:border-gray-700">
                                <div className="w-10 flex items-center justify-center bg-[#5A4FB5] text-white"><CalendarRange size={16} /></div>
                                <div className="flex-1 p-3">
                                    <p className="font-semibold text-sm dark:text-white truncate">{meeting.title || "Meeting"}</p>
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{new Date(meeting.startTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })} • {new Date(meeting.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                                    <p className="text-xs text-gray-500 mt-1">With: {meeting.lead?.contact?.name || "Client"}</p>
                                </div>
                            </div>
                        ))}
                    </>
                )}
              </div>
              <button className="mt-4 w-full py-2 bg-[#5A4FB5] text-white rounded-xl text-sm font-medium hover:bg-[#4a4194] transition">View All Activities</button>
            </div>

            {/* Pie Chart: Lead Source */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
                <h3 className="text-center text-lg font-semibold mb-1 dark:text-white">Lead Source Breakdown</h3>
                <div className="h-[250px] w-full mt-3 flex items-center justify-center">
                    {isLoading ? <Skeleton className="w-full h-full rounded-full" /> : pieData.length === 0 ? (
                          <div className="text-gray-400 text-sm text-center">
                            No source data available.
                          </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                    {pieData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: number) => [val, "Leads"]} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mt-4 mx-auto w-56">
                    {pieData.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                            <span className="text-gray-600 dark:text-gray-400 truncate">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </div>

          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Recent Deals */}
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="text-center text-lg font-semibold mb-1 dark:text-white">Recent Deals</h3>
              <div className="space-y-3 mt-4">
                  {isLoading ? (
                      <>
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                      </>
                  ) : (
                      summary?.recentDeals?.map((deal: any) => (
                          <div key={deal.id} className="border dark:border-gray-800 rounded-xl p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                              <div className="overflow-hidden">
                                <p className="font-medium dark:text-gray-200 truncate w-40">{deal.title}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">{formatIDR(Number(deal.value))}</p>
                              </div>
                              <span className="text-[#5A4FB5] text-xs font-medium bg-[#5A4FB5]/10 px-2 py-1 rounded-md">WON</span>
                          </div>
                      ))
                  )}
                  {summary?.recentDeals?.length === 0 && <p className="text-center text-sm text-gray-400">No deals yet.</p>}
              </div>
              <button className="mt-5 w-full py-3 bg-[#5A4FB5] text-white rounded-xl text-sm font-medium hover:bg-[#4a4194] transition">View All</button>
           </div>

           {/* Pipeline Overview */}
           <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-md border dark:border-gray-800">
              <h3 className="text-center text-lg font-semibold mb-1 dark:text-white">Pipeline Overview</h3>
              <div className="space-y-4 mt-4">
                  {isLoading ? (
                      <>
                          <Skeleton className="h-8 w-full" />
                          <Skeleton className="h-8 w-full" />
                      </>
                  ) : (
                      charts?.pipelineOverview?.map((stage: any, idx: number) => (
                          <div key={idx}>
                              <div className="flex justify-between mb-1 text-sm dark:text-gray-300">
                                  <span className="capitalize">{stage.stage.replace(/_/g, ' ').toLowerCase()}</span>
                                  <span>{stage.count} deals</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
                                  <div className="h-full bg-[#5A4FB5] rounded-full" style={{ width: `${(stage.count / (metrics?.activeDeals?.count || 1)) * 100}%` }}></div>
                              </div>
                          </div>
                      ))
                  )}
                  {(!charts?.pipelineOverview || charts.pipelineOverview.length === 0) && <p className="text-center text-gray-400 text-sm">No active pipeline data.</p>}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}