import { prisma } from "@/lib/prisma";
import TeamDetail from "../TeamDetail";
import { notFound } from "next/navigation";

// Helper untuk format bulan (Jan, Feb, Mar)
const getMonthName = (date: Date) => {
  return date.toLocaleString('default', { month: 'short' });
};

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  // 1. Fetch data User + Leads (Ambil leads setahun terakhir untuk chart)
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      workInfo: true,
      role: true,
      manager: true,
      leadsOwned: {
        orderBy: { createdAt: 'desc' },
        // Ambil data yang cukup untuk chart setahun
        where: {
            createdAt: {
                gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
            }
        }
      },
      _count: {
        select: { leadsOwned: true } 
      }
    },
  });

  if (!user) return notFound();
  const userData = user as any;
  const rawLeads = userData.leadsOwned || [];
  
  const leads = rawLeads.map((lead: any) => ({
    ...lead,
    // Konversi Decimal ke Number agar bisa lewat dari Server ke Client
    value: lead.value ? Number(lead.value) : 0, 
    // Pastikan tanggal aman (opsional, Next.js skrg pintar handle Date, tapi Decimal wajib diubah)
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
  }));

  // ==========================================
  // 2. HITUNG LOGIC PERFORMANCE (Server Side)
  // ==========================================
  
  // A. Filter Deals WON
  const wonDeals = leads.filter((l: any) => l.stage?.toUpperCase() === "WON");
  const lostDeals = leads.filter((l: any) => l.stage?.toUpperCase() === "LOST");
  const closedDealsCount = wonDeals.length + lostDeals.length;

  // B. KPI Calculations
  const totalRevenue = wonDeals.reduce((acc: number, curr: any) => acc + Number(curr.value || 0), 0);
  const winRate = closedDealsCount > 0 ? Math.round((wonDeals.length / closedDealsCount) * 100) : 0;
  const avgDealSize = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

  // C. Chart Data Preparation (Group by Month)
  const chartMap = new Map();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Inisialisasi Map dengan 0
  months.forEach(m => chartMap.set(m, { month: m, revenue: 0, target: 50000000, dealsCount: 0 })); // Target dummy 50jt

  // Isi data dari Leads
  leads.forEach((lead: any) => {
    const month = getMonthName(new Date(lead.createdAt));
    const current = chartMap.get(month);
    
    // Jika deal WON, tambah revenue
    if (lead.stage?.toUpperCase() === "WON") {
        current.revenue += Number(lead.value || 0);
    }
    // Hitung total deals per bulan (untuk Bar Chart)
    if (lead.stage?.toUpperCase() === "WON") {
        current.dealsCount += 1;
    }
  });

  // Konversi Map ke Array (Ambil 6 bulan terakhir biar rapi)
  const currentMonthIndex = new Date().getMonth();
  const chartDataArray = Array.from(chartMap.values());
  // Rotasi array agar bulan berjalan ada di paling kanan (opsional, simple slice aja cukup)
  const chartData = chartDataArray; 

  const quarterlyMap = {
    "Q1": 0, "Q2": 0, "Q3": 0, "Q4": 0
  };

  // Loop data bulanan yang sudah ada, masukkan ke keranjang Kuartal
  chartData.forEach((data: any) => {
    const m = data.month; // "Jan", "Feb", ...
    
    if (["Jan", "Feb", "Mar"].includes(m)) quarterlyMap["Q1"] += data.revenue;
    else if (["Apr", "May", "Jun"].includes(m)) quarterlyMap["Q2"] += data.revenue;
    else if (["Jul", "Aug", "Sep"].includes(m)) quarterlyMap["Q3"] += data.revenue;
    else if (["Oct", "Nov", "Dec"].includes(m)) quarterlyMap["Q4"] += data.revenue;
  });

  // Ubah ke format Array untuk Recharts
  const quarterlyData = Object.entries(quarterlyMap).map(([name, value]) => ({
    name,  // "Q1", "Q2"...
    value  // Total Revenue
  }));

  // ==========================================
  // 3. Mapping Data Props
  // ==========================================
  const memberData = {
    id: userData.id,
    name: userData.fullName,
    photo: userData.photo,
    role: userData.workInfo?.roleTitle || userData.role?.name || "Staff",
    roleTitle: userData.workInfo?.roleTitle || userData.role?.name || "Staff",
    dept: userData.workInfo?.department || "General",
    status: userData.status ? userData.status.toLowerCase() : "active",
    email: userData.email,
    joined: userData.workInfo?.joinedAt ? new Date(userData.workInfo.joinedAt).toLocaleDateString() : "-",
    bio: userData.workInfo?.bio || "No bio available.",
    skills: userData.workInfo?.skills || [],
    phone: userData.phone || "-",
    location: userData.workInfo?.location || "-",
    reportsTo: userData.managerId || "",
    managerName: userData.manager?.fullName || null,
    
    dealsCount: userData._count?.leadsOwned || 0,
    deals: leads, // Untuk Tab Deals

    // 🔥 DATA PERFORMANCE (Siap Pakai)
    performance: {
        kpis: {
            totalRevenue,
            winRate,
            avgDealSize,
            dealsClosedCount: closedDealsCount
        },
        chartData: chartData,
        quarterlyData: quarterlyData
    }
  };

  return <TeamDetail member={memberData} />;
}