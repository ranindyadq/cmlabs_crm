"use client";

import {
  DollarSign,
  Target,
  Package2,
  Clock,
  ArrowUp,
  ArrowDown,
  Briefcase,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// 1. Terima Prop 'data' langsung dari Parent
export default function PerformanceTab({ data }: { data: any }) {
  
  // Jika data kosong/null
  if (!data) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
            <Briefcase size={40} className="mb-3 opacity-20" />
            <p>No performance data available.</p>
        </div>
    );
  }

  const { kpis, chartData, quarterlyData } = data;

  return (
    <div className="space-y-8">

      {/* ========================
          KPI GRID (4 CARDS)
      ============================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* TOTAL REVENUE */}
        <KpiCard
          bg="rgba(21, 128, 61, 0.08)"
          iconBg="rgba(21, 128, 61, 0.2)"
          icon={<DollarSign size={20} className="text-green-700" />}
          label="Total Revenue"
          value={`Rp ${kpis.totalRevenue.toLocaleString("id-ID")}`}
          change="+12.5%"
          changeColor="#15803d"
          trend="up"
        />

        {/* WIN RATE */}
        <KpiCard
          bg="rgba(29, 78, 216, 0.08)"
          iconBg="rgba(29, 78, 216, 0.2)"
          icon={<Target size={20} className="text-blue-700" />}
          label="Win Rate"
          value={`${kpis.winRate}%`}
          change="+5%"
          changeColor="#15803d"
          trend="up"
        />

        {/* AVG DEAL SIZE */}
        <KpiCard
          bg="#7e22ce33"
          iconBg="#7e22ce55"
          icon={<Package2 size={22} color="#7e22ce" />}
          label="Avg. Deal Size"
          value={`Rp ${Math.round(kpis.avgDealSize).toLocaleString("id-ID")}`}
          change="-3.2%"
          changeColor="#de3334"
          trend="down"
        />

        {/* AVG CLOSE TIME (Mapped to Deals Closed Count as requested) */}
        <KpiCard
          bg="#c2410c33"
          iconBg="#c2410c55"
          icon={<Clock size={22} color="#c2410c" />}
          label="Deals Closed" // Label disesuaikan sedikit agar logis dengan datanya
          value={`${kpis.dealsClosedCount}`}
          change="Total"
          changeColor="#c2410c"
          trend="neutral"
        />
      </div>

      {/* ================================
          Monthly Revenue vs Target Chart
      =================================== */}
      <div className="bg-gray-500 p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="font-semibold mb-3 text-white">
            Monthly Revenue vs Target
        </h3>

        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
                {/* Grid */}
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />

                {/* X Axis - bulan */}
                <XAxis
                dataKey="month"
                tick={{ fill: "white", fontSize: 12 }}
                axisLine={{ stroke: "white" }}
                tickLine={{ stroke: "white" }}
                />

                {/* Y Axis - angka */}
                <YAxis
                tick={{ fill: "white", fontSize: 12 }}
                axisLine={{ stroke: "white" }}
                tickLine={{ stroke: "white" }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} // Format biar rapi (Juta)
                />

                {/* Tooltip theme putih */}
                <Tooltip
                contentStyle={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    color: "#000",
                }}
                formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`}
                />

                {/* Revenue Line (purple) */}
                <Line
                type="monotone"
                dataKey="revenue"
                stroke="#be95ff"
                strokeWidth={3}
                dot={{ r: 5, fill: "#be95ff" }}
                />

                {/* Target Line (white) */}
                <Line
                type="monotone"
                dataKey="target"
                stroke="#ffffff"
                strokeWidth={3}
                dot={{ r: 5, fill: "#ffffff" }}
                />
            </LineChart>
            </ResponsiveContainer>
        </div>

        {/* ===== Legend ===== */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white">
            <div className="flex items-center gap-2">
            <span className="w-4 h-[3px] rounded-full bg-[#be95ff]" />
            <span>Revenue</span>
            </div>

            <div className="flex items-center gap-2">
            <span className="w-4 h-[3px] rounded-full bg-white" />
            <span>Target</span>
            </div>
        </div>
      </div>

      {/* ================================
          Bottom 2 Cards (2 Column Grid)
      =================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 2: Monthly Deals Closed (Bar Chart Blue) */}
        <div className="bg-blue-500 p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="font-semibold mb-4 text-white">
                Monthly Deals Closed
            </h3>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{ left: -30, right: 0 }}
                >
                    <XAxis
                    dataKey="month"
                    tick={{ fill: "#ffffff" }}
                    axisLine={{ stroke: "#ffffff" }}
                    tickLine={{ stroke: "#ffffff" }}
                    />
                    <YAxis
                    tick={{ fill: "#ffffff" }}
                    axisLine={{ stroke: "#ffffff" }}
                    tickLine={{ stroke: "#ffffff" }}
                    allowDecimals={false} // Supaya tidak ada 1.5 deal
                    />
                    <Tooltip
                    contentStyle={{
                        backgroundColor: "#ffffff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                    }}
                    itemStyle={{ color: "#111827" }}
                    labelStyle={{ color: "#111827" }}
                    />
                    {/* Bar Lime Green */}
                    <Bar
                    dataKey="dealsCount"
                    fill="#C7E800"
                    radius={[6, 6, 0, 0]}
                    />
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-gray-500 p-6 rounded-2xl shadow-md border border-gray-100">
            <h3 className="font-semibold mb-4 text-white">
                Quarterly Revenue (Q1 - Q4)
            </h3>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={quarterlyData} // 🔥 Pakai Data Kuartal
                    margin={{ left: -10, right: 0 }}
                >
                    <XAxis
                        dataKey="name" // "Q1", "Q2"...
                        tick={{ fill: "#ffffff" }}
                        axisLine={{ stroke: "#ffffff" }}
                        tickLine={{ stroke: "#ffffff" }}
                    />
                    <YAxis
                        tick={{ fill: "#ffffff" }}
                        axisLine={{ stroke: "#ffffff" }}
                        tickLine={{ stroke: "#ffffff" }}
                        tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip
                        cursor={{fill: 'rgba(255,255,255,0.1)'}}
                        contentStyle={{
                            backgroundColor: "#ffffff",
                            borderRadius: "8px",
                            border: "none",
                            color: "#000"
                        }}
                        formatter={(value: number) => `Rp ${value.toLocaleString("id-ID")}`}
                    />
                    <Bar
                        dataKey="value"
                        fill="#22c55e" // Warna Hijau
                        radius={[8, 8, 0, 0]}
                        barSize={50} // Bar lebih gemuk karena datanya sedikit (cuma 4)
                    >
                         {/* Opsional: Label di atas bar */}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </div>
    </div>
  );
}

/* ============================
      KPI CARD COMPONENT
=============================== */
function KpiCard({
  bg,
  icon,
  iconBg,
  label,
  value,
  change,
  changeColor,
  trend,
}: any) {
  return (
    <div
      className="p-5 rounded-2xl shadow-sm border border-gray-100 transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: bg }}
    >
      <div className="flex justify-between items-start">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          {icon}
        </div>

        <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: changeColor }}>
          {trend === "up" ? (
            <ArrowUp size={16} />
          ) : trend === "down" ? (
            <ArrowDown size={16} />
          ) : null}
          {change}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-700 font-medium">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}