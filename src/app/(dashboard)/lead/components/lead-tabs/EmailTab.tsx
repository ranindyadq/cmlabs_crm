"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import { Mail, Plus, Filter } from "lucide-react";

export default function EmailTab({  leadId, 
  onRefresh 
}: { 
  leadId: string; 
  onRefresh?: () => void; 
}) {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);

  // Form
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toAddress, setToAddress] = useState("");

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}?activity_type=EMAIL`);
      setEmails(res.data.data.emails || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (leadId) fetchEmails(); }, [leadId]);

  const handleSend = async () => {
    try {
      await apiClient.post(`/leads/${leadId}/emails`, {
        subject,
        body,
        toAddress,
        fromAddress: "system@cmlabs.co" // Idealnya dari profil user
      });
      setShowPopup(false);
      fetchEmails();
      onRefresh?.();
    } catch (err) { alert("Gagal log email"); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowPopup(true)} className="flex items-center gap-2 bg-[#5A4FB5] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#4a4194] transition">
          <Plus className="w-4 h-4" /> Log Email
        </button>
      </div>

      <div className="space-y-4">
        {loading ? <p className="text-center text-sm text-gray-400">Loading emails...</p> :
         emails.length === 0 ? <p className="text-center text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 py-6 rounded">No emails logged.</p> :
         emails.map((email) => (
           <div key={email.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                 <Mail className="w-4 h-4 text-[#5A4FB5]" />
                 <span className="font-semibold text-sm dark:text-white">{email.subject}</span>
                 <span className="text-xs text-gray-400 ml-auto">{new Date(email.sentAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">To: {email.toAddress}</p>
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded">{email.body}</div>
           </div>
         ))
        }
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-[500px] shadow-lg">
              <h3 className="font-bold mb-4 dark:text-white">Log Email</h3>
              <div className="space-y-3 text-sm">
                 <input 
                    className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded" 
                    placeholder="To: email@client.com" 
                    value={toAddress} 
                    onChange={e => setToAddress(e.target.value)} 
                 />
                 <input 
                    className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded" 
                    placeholder="Subject" 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                 />
                 <textarea 
                    className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded h-32" 
                    placeholder="Email body..." 
                    value={body} 
                    onChange={e => setBody(e.target.value)} 
                 />
                 
                 <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setShowPopup(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition">Cancel</button>
                    <button onClick={handleSend} className="bg-[#5A4FB5] text-white px-4 py-2 rounded hover:bg-[#4a4194] transition">Save Log</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}