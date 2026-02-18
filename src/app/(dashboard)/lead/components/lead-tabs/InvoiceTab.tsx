"use client";
import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, ChevronDown, MoreHorizontal, Send, CheckCircle, Edit2, X, DollarSign, Pencil, Calendar, ChevronUp } from "lucide-react";
import apiClient from "@/lib/apiClient";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import InvoicePreview from "./InvoicePreview";
import ConfirmationModal from "../ConfirmationModal";

interface InvoiceItem {
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  notes: string;
  items: { itemName: string; quantity: number; unitPrice: number; total: number }[];
  subtotal: number;
  tax: number;
  totalAmount: number;
}

interface Props {
  leadId: string;
  showForm: boolean;
  setShowForm: (v: boolean) => void;
  leadData?: any;
  onRefresh: () => void;
  filterStatus?: string; 
  searchQuery?: string;
}

const CustomDateInput = ({ value, onClick, onChange, placeholder, error }: any) => (
  <div className="relative w-full cursor-pointer" onClick={onClick}>
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
      <Calendar size={16} />
    </div>
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly
      className={`w-full border rounded-lg py-2 pl-10 pr-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all
        ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
    />
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
      <ChevronDown size={16} />
    </div>
  </div>
);

export default function InvoiceTab({ leadId, 
  showForm, 
  setShowForm, 
  leadData, 
  onRefresh,
  filterStatus = "ALL", // Default ALL
  searchQuery = "" }: Props) {
  // === State ===
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [status, setStatus] = useState("Draft");
  const [items, setItems] = useState<InvoiceItem[]>([{ itemName: "", quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const maxNotesLength = 100;

  // Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Summary Calculation
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0), [items]);
  const tax = useMemo(() => subtotal * 0.1, [subtotal]);
  const totalAmount = useMemo(() => subtotal + tax, [subtotal, tax]);

  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [previewLeadData, setPreviewLeadData] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const handleOpenPreview = async () => {
    setIsLoadingPreview(true);
    try {
      // Mengambil data secara paralel menggunakan Promise.all
      const [orgRes, leadRes] = await Promise.all([
        fetch('/api/organization'),
        fetch(`/api/leads/${leadId}`)
      ]);

      const orgJson = await orgRes.json();
      const leadJson = await leadRes.json();

      if (orgJson.data) setCompanyProfile(orgJson.data);
      if (leadJson.data) setPreviewLeadData(leadJson.data);
      
      setShowPreview(true);
    } catch (error) {
      console.error("Gagal mengambil data preview:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  // Helper: Currency Formatter
  const fmt = (n: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(n);
  };

  // === Fetch Data ===
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/leads/${leadId}/invoices`); 
      setInvoices(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };
  
  useEffect(() => { fetchInvoices(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await apiClient.get('/invoices/next-number');
      setInvoiceNumber(res.data.nextNumber);
    } catch (error) {
      console.error("Failed to fetch invoice number", error);
      // Fallback if API fails
      setInvoiceNumber("INV-MANUAL"); 
    }
  };

  // === Handlers ===
  const resetForm = () => {
    fetchNextInvoiceNumber();
    setInvoiceDate(null); // Kembali ke null
    setDueDate(null);
    setStatus("Draft");
    setItems([{ itemName: "", quantity: 1, unitPrice: 0 }]);
    setNotes("");
    setErrors({});
    setIsEditing(false);
    setEditId(null);
  };

  const closeModal = () => { setShowForm(false); resetForm(); };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    if (field === "quantity" || field === "unitPrice") {
      newItems[idx][field] = Number(value) >= 0 ? Number(value) : 0;
    } else {
      newItems[idx][field] = value as string;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { itemName: "", quantity: 1, unitPrice: 0 }]);

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = "Invoice number is required";
    if (!invoiceDate) newErrors.invoiceDate = "Invoice date is required";
    if (!dueDate) newErrors.dueDate = "Due date is required";

    if (invoiceDate && dueDate && dueDate < invoiceDate) {
      newErrors.dueDate = "Due date cannot be earlier than invoice date";
    }
    
    items.forEach((item, idx) => {
      if (!item.itemName.trim()) newErrors[`item_${idx}_name`] = "Item name is required";
      if (item.quantity <= 0) newErrors[`item_${idx}_qty`] = "Quantity must be greater than 0";
      if (item.unitPrice <= 0) newErrors[`item_${idx}_price`] = "Unit price must be greater than 0";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      leadId,
      invoiceNumber,
      invoiceDate: invoiceDate?.toISOString(), 
      dueDate: dueDate?.toISOString(),
      status: status.toUpperCase(),
      notes,
      items: items.map((i) => ({
        itemName: i.itemName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.quantity * i.unitPrice,
      })),
      subtotal,
      tax,
      totalAmount,
    };

    try {
      if (isEditing) {
        await apiClient.patch(`/invoices/${editId}`, payload);
      } else {
        await apiClient.post(`/leads/${leadId}/invoices`, payload);
      }
      fetchInvoices();
      onRefresh(); 
      closeModal();
    } catch (e: any) {
      console.error(e);
      if (e.response && e.response.data && e.response.data.message) {
        // Set backend error message to state
        setErrors({ ...errors, invoiceNumber: e.response.data.message });
      } else {
        alert("An unexpected system error occurred."); 
      }
    }
  };

  const handlePreviewSave = async () => {
    if (!validateForm()) {
      setShowPreview(false); // Balik ke form untuk perbaiki error
      return;
    }
    await handleSubmit();
    setShowPreview(false);
  };

  const handleEdit = (inv: InvoiceData) => {
    setIsEditing(true);
    setEditId(inv.id);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceDate(new Date(inv.invoiceDate));
    setDueDate(new Date(inv.dueDate));
    setStatus(inv.status);
    setNotes(inv.notes || "");
    setItems(inv.items.map((i) => ({ itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice })));
    setShowForm(true);
    setActiveActionMenu(null);
  };

  const handleSendInvoice = async (id: string) => {
    try {
      await apiClient.post(`/invoices/${id}/send`);
      fetchInvoices();
      onRefresh();
      setActiveActionMenu(null);
      alert("Invoice sent successfully!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await apiClient.patch(`/invoices/${id}`, { status: "Paid" });
      fetchInvoices();
      onRefresh();
      setActiveActionMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
    setActiveActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await apiClient.delete(`/invoices/${deleteConfirmId}`);
      fetchInvoices();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const updateQty = (idx: number, delta: number) => {
    const newItems = [...items];
    const currentQty = Number(newItems[idx].quantity) || 0;
    const newQty = Math.max(1, currentQty + delta); // Minimal 1 sesuai desain
    newItems[idx].quantity = newQty;
    setItems(newItems);
  };

  const updatePrice = (idx: number, delta: number) => {
    const newItems = [...items];
    const currentPrice = Number(newItems[idx].unitPrice) || 0;
    // Contoh: naik/turun per 10.000
    const newPrice = Math.max(0, currentPrice + delta); 
    newItems[idx].unitPrice = newPrice;
    setItems(newItems);
  };

  // Status Badge
  const getStatusBadge = (s: string, dueDate: string) => {
  const base = "px-3 py-1 rounded-full text-xs font-medium";
  const invStatus = s.toUpperCase();
  const isOverdue = invStatus !== "PAID" && new Date(dueDate) < new Date();

  if (invStatus === "PAID") return <span className={`${base} bg-green-100 text-green-700`}>Paid</span>;
  if (isOverdue) return <span className={`${base} bg-red-100 text-red-700 animate-pulse`}>Overdue</span>;
  if (invStatus === "SENT") return <span className={`${base} bg-blue-100 text-blue-700`}>Sent</span>;
  
  return <span className={`${base} bg-gray-200 text-gray-600`}>{s}</span>;
};

  // Isi invoice (item & harga) hanya boleh diedit jika:
  // 1. Sedang mode "Add New" (!isEditing), ATAU
  // 2. Statusnya masih "Draft"
  const isContentEditable = !isEditing || status === "Draft";

// Logika Filter & Search di InvoiceTab
const filteredInvoices = useMemo(() => {
  const now = new Date();
  // Set ke jam 00:00 agar perbandingan tanggal lebih adil (tidak terpengaruh jam/menit)
  now.setHours(0, 0, 0, 0);

  return invoices.filter((inv) => {
    // A. Logika Search (Nomor Invoice atau Notes)
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(query) ||
      (inv.notes?.toLowerCase() || "").includes(query);

    // B. Logika Filter Status
    const invStatus = inv.status.toUpperCase();
    const invDueDate = new Date(inv.dueDate);
    invDueDate.setHours(0, 0, 0, 0);

    let matchesStatus = true;
    if (filterStatus === "PAID") {
      matchesStatus = invStatus === "PAID";
    } else if (filterStatus === "DRAFT") {
      matchesStatus = invStatus === "DRAFT";
    } else if (filterStatus === "OVERDUE") {
      // OVERDUE jika: Belum Lunas DAN Tanggal Jatuh Tempo < Hari Ini
      matchesStatus = invStatus !== "PAID" && invDueDate < now;
    } else {
      matchesStatus = true; // "ALL"
    }

    return matchesSearch && matchesStatus;
  });
}, [invoices, searchQuery, filterStatus]);

  return (
    <>
      {/* === LIST TABLE === */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">Loading...</p>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-2 text-gray-500 dark:text-gray-400">No invoices yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  <th className="py-3 px-4">Invoice No.</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm">
                    <td className="py-4 px-4 font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 px-4 text-gray-500 dark:text-gray-400">
                      {new Date(inv.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(inv.status, inv.dueDate)}</td>
                    <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">{fmt(inv.totalAmount)}</td>
                    <td className="py-4 px-4 text-center relative">
                      <button
                        onClick={() => setActiveActionMenu(activeActionMenu === inv.id ? null : inv.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        <MoreHorizontal size={18} className="text-gray-500 dark:text-gray-400" />
                      </button>
                      
                      {activeActionMenu === inv.id && (
                        <div className="absolute right-4 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                          <button onClick={() => handleEdit(inv)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit2 size={14} /> Edit
                          </button>
                          {inv.status?.toUpperCase() === "DRAFT" && (
                            <button onClick={() => handleSendInvoice(inv.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Send size={14} /> Send Invoice
                            </button>
                          )}
                          {inv.status?.toUpperCase() === "SENT" && (
                            <button onClick={() => handleMarkPaid(inv.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <CheckCircle size={14} /> Mark as Paid
                            </button>
                          )}
                          <button onClick={() => handleDeleteClick(inv.id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === ADD/EDIT MODAL === */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-xl shadow-xl my-8">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Invoice" : "Add New Invoice"}
                </h2>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 pt-0 flex flex-col max-h-[73vh] overflow-y-auto no-scrollbar">
              {/* Row 1: Invoice Number + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      disabled={isEditing}
                      className={`w-full border rounded-lg py-2 px-4 pr-10 text-sm 
                        ${isEditing 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200 dark:bg-gray-900/50 dark:text-gray-500 dark:border-gray-700' 
                          : 'bg-white text-gray-900 dark:bg-gray-700 dark:text-white border-gray-300 dark:border-gray-600'
                        } 
                        ${errors.invoiceNumber ? 'border-red-500' : ''} 
                        focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white`}
                    />
                    {!isEditing && (
                    <Pencil size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    )}
                    </div>
                  {errors.invoiceNumber && <p className="text-red-500 text-xs mt-1">{errors.invoiceNumber}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <div className="relative">
                    <select
                      value={
                        status === "DRAFT" ? "Draft" : 
                        status === "SENT" ? "Sent" : 
                        status === "PAID" ? "Paid" : 
                        status // Fallback jika sudah sesuai
                      }
                      onChange={(e) => setStatus(e.target.value)}
                      className={`w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 pr-10 text-sm bg-white dark:bg-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white `} 
                    >
                      {/* Jika di DB: DRAFT, SENT, PAID -> Ubah value="DRAFT" dst. */}
                      {/* Jika di DB: Draft, Sent, Paid -> Biarkan seperti ini */}
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Paid">Paid</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Row 2: Invoice Date + Due Date - SAMA BESAR */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Date</label>
                  <DatePicker
                    selected={invoiceDate}
                    onChange={(date) => setInvoiceDate(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select Date" // Menampilkan teks saat kosong
                    wrapperClassName="w-full"
                    customInput={
                      <CustomDateInput 
                        placeholder="Select Date" 
                        error={errors.invoiceDate} 
                      />
                    }
                  />
                  {errors.invoiceDate && <p className="text-red-500 text-xs mt-1">{errors.invoiceDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <DatePicker
                    selected={dueDate}
                    onChange={(date) => setDueDate(date)}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select Date" // Menampilkan teks saat kosong
                    wrapperClassName="w-full"
                    customInput={
                      <CustomDateInput 
                        placeholder="Select Date" 
                        error={errors.dueDate} 
                      />
                    }
                  />
                  {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>
              </div>

              {/* Items Section */}
              <div className="mt-4">
                <label className="block text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-1">Items</label>
                
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                  <table className="w-full border-collapse table-fixed">
                    {/* Header lebih tipis */}
                    <thead className="bg-[#5A4FB5] text-white">
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Item Name</th>
                        <th className="py-2.5 px-2 w-[70px]">Qty</th>
                        <th className="py-2.5 px-2 w-[150px]">Unit Price</th>
                        <th className="py-2.5 px-2 w-[130px]">Total</th>
                        <th className="py-2.5 px-4 w-[40px]"></th>
                      </tr>
                    </thead>
                    
                    <tbody className="bg-white dark:bg-gray-800">
                      {items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-50 dark:border-gray-700 last:border-0">
                          {/* Item Name - Slim Padding */}
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              placeholder="Item Name"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(idx, "itemName", e.target.value)}
                              disabled={!isContentEditable}
                              className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-1 focus:ring-[#5A4FB5] outline-none transition-all"
                            />
                          </td>
                          
                          {/* Qty - Slim Padding */}
                          <td className="py-2 px-1">
                            <div className="relative group">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                disabled={!isContentEditable}
                                className="w-full pl-2 pr-6 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-center outline-none appearance-none font-medium"
                                style={{ MozAppearance: 'textfield' }} 
                              />
                              
                              {/* Container Ikon: Pointer-events-none DIHAPUS agar bisa diklik */}
                              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 text-gray-400">
                                <button 
                                  type="button"
                                  onClick={() => isContentEditable && updateQty(idx, 1)}
                                  className="hover:text-[#5A4FB5] transition-colors focus:outline-none"
                                >
                                  <ChevronUp size={10} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => isContentEditable && updateQty(idx, -1)}
                                  className="hover:text-[#5A4FB5] transition-colors focus:outline-none"
                                >
                                  <ChevronDown size={10} />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Unit Price - Slim with IDR */}
                          <td className="py-2 px-1">
                            <div className="relative flex items-center group">
                              {/* Label IDR di Kiri */}
                              <span className="absolute left-2.5 text-[9px] font-extrabold text-gray-400">IDR</span>
                              
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                disabled={!isContentEditable}
                                className="w-full pl-9 pr-6 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:border-[#5A4FB5] appearance-none"
                                style={{ MozAppearance: 'textfield' }}
                              />

                              {/* Chevron Icons di Kanan */}
                              <div className="absolute right-1.5 flex flex-col gap-0.5 text-gray-400">
                                <button 
                                  type="button"
                                  onClick={() => isContentEditable && updatePrice(idx, 10000)} // Naik 10rb
                                  className="hover:text-[#5A4FB5] transition-colors focus:outline-none"
                                >
                                  <ChevronUp size={10} />
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => isContentEditable && updatePrice(idx, -10000)} // Turun 10rb
                                  className="hover:text-[#5A4FB5] transition-colors focus:outline-none"
                                >
                                  <ChevronDown size={10} />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Total Display - Slim Gray Box */}
                          <td className="py-2 px-1">
                            <div className="flex items-center justify-start px-3 py-1.5 bg-[#F5F5F5] dark:bg-gray-700 rounded-lg text-xs font-semibold text-gray-600">
                              <span className="text-[9px] font-extrabold text-gray-400 mr-1.5">IDR</span>
                              {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                            </div>
                          </td>

                          {/* Tombol Hapus - Lingkaran Lebih Kecil */}
                          <td className="py-2 px-1 text-center">
                            <button
                              onClick={() => removeItem(idx)}
                              disabled={items.length === 1 || !isContentEditable}
                              className="w-7 h-7 flex items-center justify-center bg-[#5A4FB5] hover:bg-red-600 text-white rounded-full transition-all disabled:opacity-10"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Footer: Add Item Button Slim */}
                  {isContentEditable && (
                    <div className="p-3 bg-white dark:bg-gray-800 flex justify-center border-t border-gray-50 dark:border-gray-700">
                      <button
                        onClick={addItem}
                        className="flex items-center gap-2 text-[12px] font-bold text-[#2D2D2D] dark:text-gray-200 hover:opacity-70 transition-opacity"
                      >
                        <div className="w-5 h-5 bg-[#5A4FB5] rounded-full flex items-center justify-center">
                          <Plus size={10} className="text-white" />
                        </div>
                        Add Item
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes (kiri) + Summary (kanan) - SIDE BY SIDE */}
              <div className="grid grid-cols-2 gap-6 mt-4">
                {/* Notes - KIRI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    rows={2}
                    maxLength={maxNotesLength}
                    placeholder="Add additional notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">{notes.length}/{maxNotesLength}</div>
                </div>

                {/* Summary - KANAN */}
                <div className="flex flex-col justify-start space-y-1.5">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                    <div className="w-32 px-3 py-1.5 bg-[#F5F5F5] dark:bg-gray-700 rounded-lg flex items-center justify-start border border-transparent">
                      <span className="text-[9px] font-extrabold text-gray-400 mr-2">IDR</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {fmt(subtotal).replace('Rp', '').trim()}
                      </span>
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Tax (10%)</span>
                    <div className="w-32 px-3 py-1.5 bg-[#F5F5F5] dark:bg-gray-700 rounded-lg flex items-center justify-start border border-transparent">
                      <span className="text-[9px] font-extrabold text-gray-400 mr-2">IDR</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">
                        {fmt(tax).replace('Rp', '').trim()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Divider tipis */}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1 ml-auto w-32"></div>
                  
                  {/* Total Amount */}
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-[#2D2D2D] dark:text-white uppercase text-[10px] tracking-wider">
                      Total Amount
                    </span>
                    <div className="w-32 px-3 py-2 bg-[#F5F5F5] dark:bg-gray-800 border border-[#5A4FB5]/20 rounded-lg flex items-center justify-start">
                      <span className="text-[9px] font-extrabold text-[#5A4FB5] mr-2">IDR</span>
                      <span className="text-sm font-extrabold text-[#5A4FB5] dark:text-[#818CF8]">
                        {fmt(totalAmount).replace('Rp', '').trim()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-center gap-4 px-6 py-4 -mt-4">
              <button
                onClick={handleSubmit}
                className="px-8 py-1.5 bg-[#5A4FB5] dark:bg-white text-white dark:text-black rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                {isEditing ? "Save Changes" : "Create Invoice"}
              </button>
              <button
                type="button" // Pastikan type button agar tidak trigger submit form
                onClick={handleOpenPreview}
                disabled={isLoadingPreview}
                className="px-8 py-1.5 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:bg-transparent dark:hover:bg-gray-800 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors"
              >
                {isLoadingPreview ? "Loading..." : "Preview Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === PREVIEW MODAL === */}
      {showPreview && (
        <InvoicePreview
          data={{ 
            invoiceNumber, 
            invoiceDate: invoiceDate || new Date(), // Fallback ke tanggal hari ini jika null
            dueDate: dueDate || new Date(), 
            items, 
            notes 
          }}
          companyProfile={companyProfile}
          leadData={previewLeadData || leadData}
          onClose={() => setShowPreview(false)}
          onSave={handlePreviewSave}
          isEditMode={isEditing}
          // Tambahkan Logic Send di sini:
          onSend={() => {
            if (editId) {
              handleSendInvoice(editId); // Panggil fungsi kirim yang ada di InvoiceTab
              setShowPreview(false);     // Tutup preview
              closeModal();              // Tutup modal edit sekalian
            } else {
              alert("Please save the invoice first.");
            }
          }}
        />
      )}

      <ConfirmationModal
        open={!!deleteConfirmId}
        type="delete"
        title="Delete Invoice?"
        desc="This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmId(null)}
      />
    </>
  );
}