"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  Mail, 
  Phone, 
  MessageCircle, 
  Book, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  FileText,
  Video,
  Users
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How do I create a new lead?",
    answer: "Go to the Leads page and click the 'Add Lead' button in the top right corner. Fill in the required information such as lead title, value, and stage, then click 'Create Lead'."
  },
  {
    question: "How do I change the stage of a lead?",
    answer: "In Kanban view, simply drag and drop the lead card to the desired stage column. Alternatively, open the lead details and update the stage from the sidebar."
  },
  {
    question: "How do I export dashboard data?",
    answer: "Navigate to the Dashboard page and click the 'Export' button. You can choose to export as CSV or PDF format."
  },
  {
    question: "How do I add team members?",
    answer: "Go to the Team page (Admin access required), click 'Add Team Member', fill in their details including role assignment, and send the invitation."
  },
  {
    question: "How do I change my password?",
    answer: "Go to your Profile page, navigate to the 'Account' tab, and click 'Change Password'. Enter your current password and new password to update."
  },
  {
    question: "What do the different lead stages mean?",
    answer: "Lead In: Initial contact. Contact Mode: Active communication. Need Identified: Requirements gathered. Proposal Mode: Proposal sent. Negotiation: Price/terms discussion. Contract Sent: Final contract pending. Won/Lost: Deal completed."
  },
  {
    question: "How do I restore an archived lead?",
    answer: "Go to Leads > Archive, find the lead you want to restore, and click the 'Restore' button. The lead will be moved back to 'Lead In' stage as an active lead."
  },
  {
    question: "How do I send an invoice?",
    answer: "Open the lead details, go to the 'Invoice' tab, create or select an invoice, and click 'Send' to email it to the client."
  }
];

export default function HelpPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="h-full overflow-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="text-[#5A4FB5]" />
          Help Center
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Find answers, get support, and learn how to use CMLabs CRM
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
            <Book size={20} className="text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Documentation</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Comprehensive guides for all features
          </p>
          <a href="#" className="text-[#5A4FB5] text-sm font-medium flex items-center gap-1 hover:underline">
            Browse Docs <ExternalLink size={14} />
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
            <Video size={20} className="text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Video Tutorials</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Step-by-step video guides
          </p>
          <a href="#" className="text-[#5A4FB5] text-sm font-medium flex items-center gap-1 hover:underline">
            Watch Videos <ExternalLink size={14} />
          </a>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <Users size={20} className="text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Community</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Connect with other users
          </p>
          <a href="#" className="text-[#5A4FB5] text-sm font-medium flex items-center gap-1 hover:underline">
            Join Community <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 mb-8">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText size={20} className="text-[#5A4FB5]" />
            Frequently Asked Questions
          </h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between text-left"
              >
                <span className="font-medium text-gray-900 dark:text-white pr-4">
                  {faq.question}
                </span>
                {openFAQ === index ? (
                  <ChevronUp size={18} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-r from-[#5A4FB5] to-[#7C6FD9] rounded-xl p-6 text-white">
        <h2 className="text-lg font-bold mb-2">Still need help?</h2>
        <p className="text-white/80 mb-4">
          Our support team is ready to assist you
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="mailto:support@cmlabs-crm.com"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            <Mail size={18} />
            <span>support@cmlabs-crm.com</span>
          </a>
          <a
            href="tel:+622112345678"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
          >
            <Phone size={18} />
            <span>+62 21 1234 5678</span>
          </a>
          <button
            className="flex items-center gap-2 bg-white text-[#5A4FB5] font-medium px-4 py-2 rounded-lg opacity-60 cursor-not-allowed"
            disabled
            aria-disabled="true"
            title="Live Chat is currently unavailable"
          >
            <MessageCircle size={18} />
            <span>Live Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
