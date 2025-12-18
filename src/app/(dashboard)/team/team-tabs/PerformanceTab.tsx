"use client";

import {
  DollarSign,
  Target,
  Package2,
  Clock,
  ArrowUp,
  ArrowDown,
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

// === Dummy example data ===
const monthlyRevenue = [
  { month: "Jul", revenue: 1200, target: 1400 },
  { month: "Aug", revenue: 1500, target: 1600 },
  { month: "Sep", revenue: 1700, target: 1750 },
  { month: "Oct", revenue: 1800, target: 1900 },
  { month: "Nov", revenue: 2000, target: 2100 },
  { month: "Dec", revenue: 2200, target: 2300 },
];

const dealsClosed = [
  { month: "Jan", value: 11 },
  { month: "Feb", value: 15 },
  { month: "Mar", value: 20 },
  { month: "Apr", value: 18 },
  { month: "May", value: 22 },
  { month: "Jun", value: 14 },
];

export default function PerformanceTab() {
  return (
    <div className="space-y-8">

      {/* ========================
          KPI GRID (4 CARDS)
      ============================ */}
      <div className="grid grid-cols-4 gap-5">

        {/* TOTAL REVENUE */}
        <KpiCard
          bg="#15803d33"
          iconBg="#15803d55"
          icon={<DollarSign size={22} color="#15803d" />}
          label="Total Revenue (6 months)"
          value="$196,000"
          change="+12.5%"
          changeColor="#15803d"
          trend="up"
        />

        {/* WIN RATE */}
        <KpiCard
          bg="#1d4ed833"
          iconBg="#1d4ed855"
          icon={<Target size={22} color="#1d4ed8" />}
          label="Win Rate"
          value="65%"
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
          value="$19,600"
          change="-3.2%"
          changeColor="#de3334"
          trend="down"
        />

        {/* AVG CLOSE TIME */}
        <KpiCard
          bg="#c2410c33"
          iconBg="#c2410c55"
          icon={<Clock size={22} color="#c2410c" />}
          label="Avg. Close Time"
          value="23 days"
          change="-12%"
          changeColor="#de3334"
          trend="down"
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
            <LineChart data={monthlyRevenue}>
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
                />

                {/* Tooltip theme putih */}
                <Tooltip
                contentStyle={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    color: "#000",
                }}
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

        {/* ===== Legend di bawah chart, masih dalam card ===== */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-white">
            {/* Revenue */}
            <div className="flex items-center gap-2">
            <span className="w-4 h-[3px] rounded-full bg-[#be95ff]" />
            <span>Revenue</span>
            </div>

            {/* Target */}
            <div className="flex items-center gap-2">
            <span className="w-4 h-[3px] rounded-full bg-white" />
            <span>Target</span>
            </div>
        </div>
        </div>

      {/* ================================
          Bottom 2 Cards (2 Column Grid)
      =================================== */}
      <div className="grid grid-cols-2 gap-6">

        {/* Monthly Deals Closed */}
        <div className="bg-blue-500 p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="font-semibold mb-4 text-white">
            Monthly Deals Closed
        </h3>

        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={dealsClosed}
                margin={{ left: -30, right: 0 }}
            >
                <XAxis
                dataKey="month"
                tick={{ fill: "#ffffff" }}           // X label putih
                axisLine={{ stroke: "#ffffff" }}     // garis axis putih
                tickLine={{ stroke: "#ffffff" }}     // tick kecil putih
                />
                <YAxis
                tick={{ fill: "#ffffff" }}           // Y label putih
                axisLine={{ stroke: "#ffffff" }}
                tickLine={{ stroke: "#ffffff" }}
                />
                <Tooltip
                contentStyle={{
                    backgroundColor: "#ffffff",        // tooltip putih
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                }}
                itemStyle={{ color: "#111827" }}     // text hitam
                labelStyle={{ color: "#111827" }}
                />
                <Bar
                dataKey="value"
                fill="#facc15"
                radius={[6, 6, 0, 0]}
                />
            </BarChart>
            </ResponsiveContainer>
        </div>
        </div>

        {/* Quarterly Performance */}
        <div className="bg-gray-500 p-6 rounded-2xl shadow-md border border-gray-100">
        <h3 className="font-semibold mb-4 text-white">
            Quarterly Performance
        </h3>

        <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={dealsClosed}
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
                <Bar
                dataKey="value"
                fill="#22c55e"
                radius={[6, 6, 0, 0]}
                />
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
      className="p-5 rounded-2xl shadow-sm border border-gray-100"
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
          ) : (
            <ArrowDown size={16} />
          )}
          {change}
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-700">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
