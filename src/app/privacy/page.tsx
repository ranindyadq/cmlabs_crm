"use client";

import { useRouter } from "next/navigation";
import { HiArrowLongLeft } from "react-icons/hi2";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
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
              <Shield size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-sm">
          
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">1. Information We Collect</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We collect information you provide directly to us, such as when you create an account, 
              use our services, or contact us for support. This may include your name, email address, 
              company information, and any other information you choose to provide.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Send you technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">3. Data Security</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We take reasonable measures to help protect your personal information from loss, theft, 
              misuse, unauthorized access, disclosure, alteration, and destruction. All data is encrypted 
              in transit and at rest using industry-standard encryption protocols.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">4. Data Retention</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed 
              to provide you services. You may request deletion of your data at any time by contacting 
              our support team.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">5. Third-Party Services</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may share your information with third-party service providers who perform services 
              on our behalf, such as hosting, analytics, and customer support. These providers are 
              bound by contractual obligations to keep personal information confidential.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">6. Your Rights</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to processing of your personal data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3">7. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{" "}
              <a href="mailto:privacy@cmlabs.co" className="text-[#5A4FB5] hover:underline font-medium">privacy@cmlabs.co</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
