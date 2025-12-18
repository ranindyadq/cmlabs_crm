import { Calendar, Clock, DollarSign, CircleCheck, Target } from "lucide-react";

export default function DealsTab() {
  const kpis = {
    totalValue: 70000,
    activeDeals: 3,
    avgProbability: 58,
  };

  const deals = [
    {
      id: 1,
      title: "Website Redesign - TechCorp",
      stage: "Proposal Sent",
      stageColor: "bg-blue-100 text-blue-700",
      contact: "John Smith",
      value: 15000,
      probability: 75,
      closeDate: "15 Jan 2025",
      lastActivity: "2 hours ago",
      progress: 80,
    },
    {
      id: 2,
      title: "Mobile App UI/UX - StartupXYZ",
      stage: "Negotiation",
      stageColor: "bg-indigo-100 text-indigo-700",
      contact: "Sarah Johnson",
      value: 25000,
      probability: 60,
      closeDate: "20 Jan 2025",
      lastActivity: "5 hours ago",
      progress: 60,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Pipeline Value */}
        <div className="p-5 rounded-xl"
             style={{ backgroundColor: "rgba(126,34,206,0.12)" }}>
          <div className="text-small font-medium text-[#7e22ce] flex items-center gap-1">
            <DollarSign size={18} strokeWidth={1.8} />
            Total Pipeline Value
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            ${kpis.totalValue.toLocaleString()}
          </div>
        </div>

        {/* Active Deals */}
        <div className="p-5 rounded-xl"
             style={{ backgroundColor: "rgba(2,132,199,0.12)" }}>
          <div className="text-small font-medium text-[#0284c7] flex items-center gap-1">
            <CircleCheck size={18} strokeWidth={1.8} />
            Active Deals
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {kpis.activeDeals}
          </div>
        </div>

        {/* Avg Probability */}
        <div className="p-5 rounded-xl"
             style={{ backgroundColor: "rgba(17,185,130,0.12)" }}>
          <div className="text-small font-medium text-[#11b982] flex items-center gap-1">
            <Target size={18} strokeWidth={1.8} />
            Avg. Probability
          </div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {kpis.avgProbability}%
          </div>
        </div>
      </div>

      {/* DEAL CARDS */}
      <div className="space-y-4">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm"
          >
            {/* TITLE + VALUE */}
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{deal.title}</h3>
                  <span
                    className={`text-xs px-3 py-1 rounded-full ${deal.stageColor}`}
                  >
                    {deal.stage}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mt-1">
                  Contact: {deal.contact}
                </p>
              </div>

              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900">
                  ${deal.value.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {deal.probability}% probability
                </div>
              </div>
            </div>

            {/* CLOSE DATE + LAST ACTIVITY */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>Close: {deal.closeDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} />
                <span>Last activity: {deal.lastActivity}</span>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-4">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${deal.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
