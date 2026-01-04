"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/apiClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Plus, X, Calendar, Edit, Trash2, Printer } from "lucide-react";

export default function InvoiceTab({  leadId, 
  onRefresh 
}: { 
  leadId: string; 
  onRefresh?: () => void; 
}) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Form
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [items, setItems] = useState<{ itemName: string; quantity: number; unitPrice: number }[]>([
    { itemName: "Service 1", quantity: 1, unitPrice: 0 }
  ]);
  const [notes, setNotes] = useState("");

  // 1. FETCH INVOICES
  const fetchInvoices = async () => {
    try {
      onRefresh?.();
      setLoading(true);
      const res = await apiClient.get(`/leads/${leadId}?activity_type=INVOICE`);
      setInvoices(res.data.data.invoices || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { if (leadId) fetchInvoices(); }, [leadId]);

  // 2. CALCULATE TOTAL
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  // 3. CREATE INVOICE
  const handleCreate = async () => {
    try {
      await apiClient.post(`/leads/${leadId}/invoices`, {
        invoiceNumber,
        invoiceDate: invoiceDate?.toISOString(),
        dueDate: dueDate?.toISOString(),
        status: "DRAFT",
        notes,
        items: items // Payload sesuai backend
      });
      setShowAddPopup(false);
      fetchInvoices();
    } catch (error) {
      alert("Gagal membuat invoice (Cek nomor invoice unik)");
    }
  };

  // Helper Item
  const updateItem = (index: number, field: string, val: any) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = val;
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { itemName: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowAddPopup(true)} className="flex items-center gap-2 bg-[#5A4FB5] text-white px-3 py-1.5 rounded-md text-sm hover:bg-[#4a42a5] transition">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* LIST INVOICES */}
      <div className="space-y-3">
        {loading ? <p className="text-center text-gray-400 text-sm">Loading invoices...</p> :
         invoices.length === 0 ? <p className="text-center text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 py-6 rounded">No invoices created.</p> :
         invoices.map((inv) => (
           <div key={inv.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 flex justify-between items-center shadow-sm">
              <div>
                 <p className="font-bold text-gray-800 dark:text-white">{inv.invoiceNumber}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                 <p className="font-semibold text-[#5A4FB5]">IDR {Number(inv.totalAmount).toLocaleString()}</p>
                 <span className={`text-xs px-2 py-0.5 rounded ${inv.status === 'PAID' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'}`}>
                    {inv.status}
                 </span>
              </div>
           </div>
         ))
        }
      </div>

      {/* POPUP CREATE */}
      {showAddPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto">
           <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-[700px] my-10 max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between mb-4">
                 <h3 className="font-bold text-lg dark:text-white">New Invoice</h3>
                 <button onClick={() => setShowAddPopup(false)} className="dark:text-gray-400 dark:hover:text-white"><X size={20}/></button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className="text-xs font-bold block mb-1 dark:text-gray-300">Invoice No</label>
                    <input className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded text-sm" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div>
                       <label className="text-xs font-bold block mb-1 dark:text-gray-300">Date</label>
                       <div className="dark:text-white dark:[&_input]:bg-gray-900 dark:[&_input]:border-gray-700 dark:[&_input]:text-white">
                         <DatePicker selected={invoiceDate} onChange={(d) => setInvoiceDate(d)} className="w-full border dark:border-gray-700 bg-transparent p-2 rounded text-sm" />
                       </div>
                    </div>
                    <div>
                       <label className="text-xs font-bold block mb-1 dark:text-gray-300">Due</label>
                       <div className="dark:text-white dark:[&_input]:bg-gray-900 dark:[&_input]:border-gray-700 dark:[&_input]:text-white">
                         <DatePicker selected={dueDate} onChange={(d) => setDueDate(d)} className="w-full border dark:border-gray-700 bg-transparent p-2 rounded text-sm" />
                       </div>
                    </div>
                 </div>
              </div>

              {/* Items */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-4">
                 <h4 className="font-bold text-sm mb-2 dark:text-gray-300">Items</h4>
                 {items.map((item, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                       <input className="flex-1 border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white p-2 rounded text-sm" placeholder="Item Name" value={item.itemName} onChange={e => updateItem(i, 'itemName', e.target.value)} />
                       <input className="w-16 border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white p-2 rounded text-sm text-center" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', Number(e.target.value))} />
                       <input className="w-32 border dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white p-2 rounded text-sm" type="number" placeholder="Price" value={item.unitPrice} onChange={e => updateItem(i, 'unitPrice', Number(e.target.value))} />
                       <button onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                    </div>
                 ))}
                 <button onClick={addItem} className="text-xs text-[#5A4FB5] font-bold mt-2 hover:text-[#4a42a5]">+ Add Item</button>
              </div>

              <div className="flex justify-between items-end">
                 <div className="w-1/2">
                    <label className="text-xs font-bold block mb-1 dark:text-gray-300">Notes</label>
                    <textarea className="w-full border dark:border-gray-700 bg-transparent dark:bg-gray-900 dark:text-white p-2 rounded h-20 text-sm" value={notes} onChange={e => setNotes(e.target.value)} />
                 </div>
                 <div className="text-right space-y-1 dark:text-gray-300">
                    <p className="text-sm">Subtotal: {subtotal.toLocaleString()}</p>
                    <p className="text-sm">Tax (10%): {tax.toLocaleString()}</p>
                    <p className="font-bold text-lg text-[#5A4FB5]">Total: IDR {total.toLocaleString()}</p>
                 </div>
              </div>

              <button onClick={handleCreate} className="w-full bg-[#5A4FB5] text-white py-2.5 rounded-lg mt-6 font-bold hover:bg-[#4a42a5] transition">
                 Create Invoice
              </button>
           </div>
        </div>
      )}
    </div>
  );
}