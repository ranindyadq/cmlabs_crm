import { X, Printer, Send, Save, Edit, Eye } from "lucide-react";

interface InvoicePreviewProps {
  data: any; // Data invoice (bisa dari form state atau data DB)
  companyProfile: any; // Data perusahaan kamu (Logo, Alamat)
  leadData: any; // Data client (Billed To)
  onClose: () => void;
  onSave: () => void; // Fungsi simpan/create
  isEditMode?: boolean; // Apakah ini mode preview sebelum create atau preview data lama?
  onSend?: () => void;
}

export default function InvoicePreview({ 
  data, 
  companyProfile, 
  leadData, 
  onClose, 
  onSave, 
  isEditMode,
  onSend
}: InvoicePreviewProps) {

  const formatIDR = (amount: number) => {
    return "IDR " + new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Hitung ulang untuk preview visual (jika data belum saved)
  const subtotal = data.items?.reduce((acc: number, item: any) => 
    acc + (item.quantity * item.unitPrice), 0) || 0;
  const tax = subtotal * 0.1; // Asumsi 10%
  const total = subtotal + tax;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      {/* Container Putih Besar */}
      <div className="bg-[#E8E8E8] rounded-2xl shadow-2xl w-full max-w-xl max-h-[97vh] overflow-hidden flex flex-col border border-gray-200">
        
        {/* === HEADER ACTIONS === */}
        <div className="flex justify-between items-center px-4 py-2 bg-transparent shrink-0">
          <div className="flex items-center gap-3">
            <Eye size={20} className="text-gray-700" />
            <h3 className="font-semibold text-base text-gray-900">Preview</h3>
          </div>
          <div className="flex gap-1">
            {/* Tombol Edit */}
            <button 
              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700" 
              title="Edit"
              onClick={onClose}
            >
              <Edit size={16} />
            </button>

            {/* Tombol Send */}
            <button 
              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed" 
              title={isEditMode ? "Send Email" : "Save first to send"}
              onClick={onSend}
              disabled={!isEditMode}
            >
              <Send size={16} />
            </button>

            {/* Tombol Print */}
            <button 
              className="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700" 
              title="Print" 
              onClick={() => window.print()}
            >
              <Printer size={16} />
            </button>
            
            {/* Tombol Save as Draft */}
            <button 
              onClick={onSave}
              className="bg-[#5A4FB5] text-white px-4 py-1 rounded-lg text-xs font-medium flex items-center gap-0 hover:bg-gray-800 transition-colors"
            >
              <Save size={16}/> 
              {isEditMode ? "Save Changes" : "Save as Draft"}
            </button>
          </div>
        </div>

        {/* === KERTAS INVOICE (Area Print) === */}
        <div className="flex-1 overflow-y-auto bg-[#E8E8E8] dark:bg-gray-900 pb-3 pt-2 no-scrollbar">
          <div 
            className="max-w-[550px] mx-auto bg-white dark:bg-gray-800 p-4 shadow-lg min-h-[550px] rounded-sm w-full" 
            id="print-area"
          >
            
            {/* Header Invoice */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h1 className="text-[16px] font-bold text-gray-900">Invoice</h1>
                <p className="text-gray-500 text-[10px] font-medium">
                  {data.invoiceNumber || "INV-20250801-001"}
                </p>
              </div>
              <div className="text-right">
                <h2 className="text-[18px] font-bold text-gray-900">CRM cmlabs</h2>
              </div>
            </div>

            <div className="border-b border-gray-500 mb-3"></div>

            {/* Billed By & Billed To */}
            <div className="grid grid-cols-2 gap-12 mb-3 text-sm">
              <div>
                <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Billed By:</p>
                <p className="font-bold text-[13px] text-black">{companyProfile?.companyName || "cmlabs"}</p>
                <p className="text-gray-600 text-[11px] leading-relaxed whitespace-pre-line">
                  {companyProfile?.addressLine1}
                  {companyProfile?.city && `, ${companyProfile.city}`}
                  {/* Logika penggabungan alamat dari model OrganizationProfile */}
                </p>
                <p className="text-gray-600 text-[11px]">{companyProfile?.email}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-500 text-[10px] uppercase tracking-wide">Billed To:</p>
                <p className="font-bold text-[13px] text-black">
                  {leadData?.company?.name || leadData?.contact?.name || "Client Name"}
                </p>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  {leadData?.company?.address || leadData?.contact?.address || "Client Address"}
                </p>
                <p className="text-gray-600 text-[11px]">{leadData?.contact?.email}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-12 mb-3 text-[11px]">
              <div>
                <p className="text-gray-500 font-medium mb-1">Date Invoice:</p>
                <p className="font-semibold text-gray-900">
                  {data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long', 
                    day: 'numeric'
                  }) : "August 1, 2025"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 font-medium mb-1">Due Date:</p>
                <p className="font-semibold text-gray-900">
                  {data.dueDate ? new Date(data.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "August 1, 2025"}
                </p>
              </div>
            </div>

            {/* TABLE ITEMS */}
            <div className="border border-gray-200 rounded-xl overflow-hidden -mb-2">
              <table className="w-full">
                <thead className="bg-[#5A4FB5] border-b border-gray-200">
                  <tr className="text-left text-[9px] font-bold text-white uppercase tracking-wide">
                    <th className="py-2 px-6">Item Name</th>
                    <th className="py-2 px-4 text-center">Qty</th>
                    <th className="py-2 px-4">Unit Price</th>
                    <th className="py-2 px-6">Total</th>
                  </tr>
                </thead>
                <tbody className="text-[11px] bg-white">
                  {data.items?.length > 0 ? (
                    data.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-6 font-medium text-gray-900">
                          {item.itemName || `Item ${idx + 1}`}
                        </td>
                        <td className="py-3 px-4 text-center text-gray-600">
                          {item.quantity || 0}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatIDR(item.unitPrice || 0)}
                        </td>
                        <td className="py-3 px-6 font-semibold text-gray-900">
                          {formatIDR((item.quantity || 0) * (item.unitPrice || 0))}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-gray-400 font-medium">
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-gray-200 mt-6 mb-2"></div>

            {/* TOTALS */}
            <div className="flex flex-col gap-2 mb-4 px-1">
              {/* Subtotal */}
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-gray-900 uppercase text-[11px] tracking-tight">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  {formatIDR(subtotal)}
                </span>
              </div>
              {/* Tax */}
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-gray-900 uppercase text-[11px] tracking-tight">Tax(10%)</span>
                <span className="font-semibold text-gray-900">
                  {formatIDR(tax)}
                </span>
              </div>
              {/* Total Amount - Dengan Garis Pemisah Tambahan */}
              <div className="flex justify-between items-center pt-1 border-t border-gray-200">
                <span className="font-semibold text-gray-900 text-[12px] uppercase tracking-wider">
                  Total Amount
                </span>
                <span className="font-semibold text-gray-900 text-[12px]">
                  {formatIDR(total)}
                </span>
              </div>
            </div>

            {/* NOTES */}
            <div className="bg-gray-100 rounded-lg p-3 mb-1">
              <p className="font-semibold text-[12px] text-gray-900 mb-1">Notes</p>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                {data.notes || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
              </p>
            </div>

            {/* FOOTER */}
            <div className="flex justify-between items-center pt-3">
              <h3 className="text-[20px] font-bold tracking-widest text-[#5A4FB5] uppercase">
                Thank You!
              </h3>
              
              <div className="text-right text-[10px] font-semibold flex items-center gap-4">
                {/* Nomor Telepon Dinamis dari Profile Organisasi */}
                <span className="text-gray-400">
                  {companyProfile?.phone || "088897233"}
                </span>
                
                {/* Nama Perusahaan Dinamis */}
                <span className="text-gray-900 font-bold tracking-tight">
                  {companyProfile?.companyName || "cmlabs"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}