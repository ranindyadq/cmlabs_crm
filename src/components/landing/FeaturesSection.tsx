// components/landing/FeaturesSection.tsx

"use client"; // 1. WAJIB: Tambahkan ini kembali untuk Framer Motion
import { KanbanSquare, LayoutDashboard, Users } from 'lucide-react';
import { motion } from 'framer-motion'; // 2. Impor motion kembali

// Tipe data (dengan colorClass)
type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string; 
};

// Fitur Anda (dengan colorClass)
const features: Feature[] = [
  {
    icon: <KanbanSquare className="h-6 w-6 text-white" />,
    title: 'Lead Management with Kanban',
    description: 'Track prospects from lead to client. Update deal stages on a visual Kanban board and log all sales activities like meetings and calls.',
    colorClass: 'bg-primary' // Palm Purple [cite: 191]
  },
  {
    icon: <LayoutDashboard className="h-6 w-6 text-white" />,
    title: 'Real-time Dashboard & Analytics',
    description: 'Monitor key metrics like Total Pipeline Value, Active Deals, and conversion rates. Visualize performance with monthly revenue charts and lead source reports.',
    colorClass: 'bg-info' // Rodger Blue [cite: 205]
  },
  {
    icon: <Users className="h-6 w-6 text-white" />,
    title: 'Team & Role Management',
    description: 'Add, edit, and manage your team members. Assign roles like "Admin" or "Sales" to control data access and assign leads to the correct PIC.',
    colorClass: 'bg-success' // Dark Spring Green [cite: 198]
  },
];


export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-[#CAA9FF]/20 py-20">
      <div className="container mx-auto px-4">
        
        <h2 className="text-3xl font-bold text-center mb-4 text-text-strong">
          All The <span className="text-primary">Tools</span> Your <span className="text-primary">Team</span> Needs
        </h2>
        <p className="text-center mb-12 max-w-xl mx-auto">
          Core modules designed to help your sales team <span className="text-primary font-medium">manage leads</span>, 
          <span className="text-primary font-medium"> track performance</span>, and grow your business.
        </p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            // 3. Ganti <div> kembali menjadi <motion.div>
            <motion.div
              key={feature.title}
              // 4. Tambahkan 'whileHover' kembali
              whileHover={{ 
                y: -5, // Sedikit terangkat ke atas
                boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)", // Bayangan membesar
                transition: { duration: 0.2 } 
              }}
              className="bg-card p-6 rounded-xl shadow-lg border border-border cursor-pointer"
            >
              {/* 5. Ikon berwarna Anda (sudah benar) */}
              <div 
                className={`mb-4 flex items-center justify-center h-12 w-12 rounded-full ${feature.colorClass} p-2`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-text-strong">{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}