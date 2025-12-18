// File: src/validations/lead.schema.js
import { z } from 'zod';

// =================================================================================
// HELPER SCHEMAS & UTILITIES
// =================================================================================

// Objek kosong untuk bagian yang tidak perlu divalidasi
const emptyBody = z.object({}).strict('Unexpected body properties');
const emptyQuery = z.object({}).strict('Unexpected query parameters');
const emptyParams = z.object({}).strict('Unexpected URL parameters');

// Skema Item Invoice (Digunakan dalam Invoice)
const invoiceItemSchema = z.object({
  itemName: z.string({ required_error: 'Item name is required' }).min(1),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
});

// =================================================================================
// 1. LEAD CRUD SCHEMAS
// =================================================================================

// Skema untuk POST /api/leads (Create)
export const createLeadSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(3, 'Title must be at least 3 characters long'),
    value: z.number().optional(),
    currency: z.string().optional(),
    stage: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.coerce.date().optional(),
    // Relasi & Source
    labelId: z.string().uuid('Invalid Label ID format').optional(),
    contactId: z.string().uuid('Invalid Contact ID format').optional(),
    companyId: z.string().uuid('Invalid Company ID format').optional(),
    ownerId: z.string().uuid('Invalid Owner ID format').optional(),
    sourceOrigin: z.string().optional(),
    sourceChannel: z.string().optional(),
    sourceChannelId: z.string().optional(),
  }),
  query: emptyQuery,
  params: emptyParams,
});

// Skema untuk GET /api/leads (Read All & Filter)
export const getAllLeadsSchema = z.object({
  body: emptyBody,
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    // Filter
    view: z.enum(['active', 'archived']).optional().default('active'),
    picId: z.string().uuid().optional(),
    labelId: z.string().uuid().optional(),
    source: z.string().optional(),
    dateStart: z.coerce.date().optional(),
    dateEnd: z.coerce.date().optional(),
  }),
  params: emptyParams,
});

// Skema untuk GET /api/leads/:id (Read Detail & Activity Filter)
export const getLeadByIdSchema = z.object({
  body: emptyBody,
  query: z.object({
    activity_search: z.string().optional(),
    activity_type: z.enum(['NOTE', 'MEETING', 'CALL', 'EMAIL', 'INVOICE']).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// Skema untuk PUT /api/leads/:id (Update)
export const updateLeadSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 chars').optional(),
    value: z.number().optional(),
    currency: z.string().optional(),
    stage: z.string().optional(),
    status: z.enum(['ACTIVE', 'WON', 'LOST']).optional(),
    description: z.string().optional(),
    dueDate: z.coerce.date().optional(), // Mengubah string date ISO ke Date object otomatis
    ownerId: z.string().uuid('Invalid Owner ID format').optional(),
    contactId: z.string().uuid('Invalid Contact ID format').optional(),
    companyId: z.string().uuid('Invalid Company ID format').optional(),
    sourceOrigin: z.string().optional(),
    sourceChannel: z.string().optional(),
    sourceChannelId: z.string().optional(),
    // Catatan: labelId tidak di-update lewat rute ini
  })
  // Logika validasi tambahan: Minimal harus ada 1 field yang dikirim
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),

  query: emptyQuery,

  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// Skema untuk DELETE /api/leads/:id
export const deleteLeadSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// =================================================================================
// 2. ACTIVITY SCHEMAS
// =================================================================================

// --- NOTES ---

// Skema untuk POST /api/leads/:id/notes (Create)
export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string({ required_error: 'Content is required' }).min(1, 'Content cannot be empty'),
  }),
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// Skema untuk PATCH /api/notes/:id (Update)
export const updateNoteSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    content: z.string().min(1, 'Content cannot be empty').optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid Note ID format'),
  }),
});

// Skema untuk DELETE /api/notes/:id
export const deleteNoteSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Note ID format'),
  }),
});

// --- MEETINGS ---

// Skema untuk POST /api/leads/:id/meetings (Create)
export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string({ required_error: 'Title is required' }).min(1, 'Title cannot be empty'),
    startTime: z.coerce.date({ required_error: 'Start time is required' }),
    endTime: z.coerce.date({ required_error: 'End time is required' }),
    location: z.string().optional(),
    meetingLink: z.string().url('Invalid URL format').optional(),
    description: z.string().optional(),
    outcome: z.string().optional(),
    reminderMinutesBefore: z.coerce.number().int().optional(),
    attendeeIds: z.array(z.string().uuid()).optional(),
  }),
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// --- CALLS ---

// Skema untuk POST /api/leads/:id/calls (Create)
export const createCallSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    callTime: z.coerce.date().optional(),
    durationMinutes: z.coerce.number().int().optional(),
    direction: z.enum(['INCOMING', 'OUTGOING']).optional(),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED']).optional(),
    result: z.string().optional(),
    notes: z.string().optional(),
    contactId: z.string().uuid('Invalid Contact ID format').optional(),
    reminderMinutesBefore: z.coerce.number().int().optional(),
  }),
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// Skema untuk PATCH /api/calls/:id (Update)
export const updateCallSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    callTime: z.coerce.date().optional(),
    durationMinutes: z.coerce.number().int().optional(),
    direction: z.enum(['INCOMING', 'OUTGOING']).optional(),
    status: z.enum(['SCHEDULED', 'COMPLETED', 'MISSED']).optional(),
    result: z.string().optional(),
    notes: z.string().optional(),
    contactId: z.string().uuid().optional(),
    reminderMinutesBefore: z.coerce.number().int().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid Call ID format'),
  }),
});

// --- EMAILS ---

// Skema untuk POST /api/leads/:id/emails (Create)
export const createEmailSchema = z.object({
  body: z.object({
    fromAddress: z.string({ required_error: 'From address is required' }).email('Invalid From email format'),
    toAddress: z.string({ required_error: 'To address is required' }).email('Invalid To email format'),
    ccAddress: z.string().email('Invalid Cc email format').optional(),
    bccAddress: z.string().email('Invalid Bcc email format').optional(),
    subject: z.string().optional(),
    body: z.string({ required_error: 'Email body is required' }).min(1, 'Email body cannot be empty'),
    scheduledAt: z.coerce.date().optional(),
  }),
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// Skema untuk PATCH /api/emails/:id (Update)
export const updateEmailSchema = z.object({
  body: z.object({
    fromAddress: z.string().email().optional(),
    toAddress: z.string().email().optional(),
    ccAddress: z.string().email().optional(),
    bccAddress: z.string().email().optional(),
    subject: z.string().optional(),
    body: z.string().optional(),
    scheduledAt: z.coerce.date().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid Email ID format'),
  }),
});

// Skema untuk DELETE /api/emails/:id
export const deleteEmailSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Email ID format'),
  }),
});

// --- INVOICES ---

// Skema untuk POST /api/leads/:id/invoices (Create)
export const createInvoiceSchema = z.object({
  body: z.object({
    invoiceNumber: z.string({ required_error: 'Invoice number is required' }),
    invoiceDate: z.coerce.date({ required_error: 'Invoice date is required' }),
    dueDate: z.coerce.date({ required_error: 'Due date is required' }),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE'], { required_error: 'Status is required' }),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item'),
  })
  .refine(data => data.dueDate >= data.invoiceDate, {
    message: "Due Date must not be earlier than the Invoice Date",
    path: ["dueDate"],
  }),
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'),
  }),
});

// Skema untuk PATCH /api/invoices/:id (Update Full)
export const updateInvoiceSchema = z.object({
  body: z.object({
    invoiceNumber: z.string().optional(),
    invoiceDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
    notes: z.string().optional(),
    // Items boleh di-update (array) atau diabaikan (optional)
    items: z.array(invoiceItemSchema).min(1, 'Invoice must have at least one item').optional(), 
  })
  .refine(data => {
    // Validasi tanggal HANYA JIKA KEDUA TANGGAL ADA
    if (data.invoiceDate && data.dueDate) {
      return data.dueDate >= data.invoiceDate;
    }
    return true;
  }, {
    message: "Due Date must not be earlier than the Invoice Date",
    path: ["dueDate"],
  }),
  params: z.object({
    id: z.string().uuid('Invalid Invoice ID format'),
  }),
});

// Skema untuk DELETE /api/invoices/:id
export const deleteInvoiceSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Invoice ID format'),
  }),
});

// Skema untuk POST /api/invoices/:id/send
export const sendInvoiceSchema = z.object({
  body: emptyBody,
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Invoice ID format'),
  }),
});