"use client";

import { LeadHeader } from "./LeadHeader";
import { LeadSidebar } from "./LeadSidebar";
import { LeadTabs } from "./LeadTabs";

// Tambahkan onRefresh ke props
type LeadDetailProps = {
  lead: any;
  onRefresh: () => void;
};

export default function LeadDetail({ lead, onRefresh }: LeadDetailProps) {
  return (
    <div className="flex flex-col gap-4 text-[#2E2E2E] dark:text-white">
      {/* Header (Status, Title) */}
      <LeadHeader lead={lead} onRefresh={onRefresh} />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* Sidebar (Summary, Person, Info) */}
        <LeadSidebar lead={lead} onRefresh={onRefresh} />
        
        {/* Tabs (Activities) */}
        <div className="flex-1 min-w-0">
          <LeadTabs lead={lead} />
        </div>
      </div>
    </div>
  );
}