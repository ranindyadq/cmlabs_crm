"use client";

import { useRouter } from "next/navigation";
import { HiArrowLongLeft } from "react-icons/hi2";
import { FileText } from "lucide-react";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#5A4FB5] dark:text-gray-400 dark:hover:text-[#5A4FB5] transition-colors font-medium mb-5"
          >
            <HiArrowLongLeft size={18} /> Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#5A4FB5] to-[#7B6FD6] flex items-center justify-center shadow-lg">
              <FileText size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-sm">
          
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              By accessing and using CMLabs CRM, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">2. Use License</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Permission is granted to temporarily access and use CMLabs CRM for personal, non-commercial transitory viewing only. 
              This is the grant of a license, not a transfer of title.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">3. User Account</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Service Modifications</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              CMLabs reserves the right to modify or discontinue, temporarily or permanently, 
              the service with or without notice. We shall not be liable to you or any third party 
              for any modification, suspension, or discontinuance of the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Limitation of Liability</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              In no event shall CMLabs or its suppliers be liable for any damages arising out of the use 
              or inability to use the materials on CMLabs CRM, even if CMLabs or an authorized representative 
              has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Contact Information</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@cmlabs.co" className="text-[#5A4FB5] hover:underline font-medium">legal@cmlabs.co</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
