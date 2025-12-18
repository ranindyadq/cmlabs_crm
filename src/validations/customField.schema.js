// File: src/validations/customField.schema.js

import { z } from 'zod';

// Objek kosong untuk bagian yang tidak perlu divalidasi
const emptyBody = z.object({}).strict();
const emptyQuery = z.object({}).strict();
const emptyParams = z.object({}).strict();

// =================================================================================
// 1. CUSTOM FIELD DEFINITION
// =================================================================================

// Skema untuk POST /api/custom-fields
export const createCustomFieldSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Field name is required' }).min(1),
    type: z.enum(['TEXT', 'NUMBER', 'DATE', 'SELECT'], {
      required_error: 'Field type is required',
    }),
  }),
  query: emptyQuery,
  params: emptyParams,
});

// =================================================================================
// 2. CUSTOM FIELD VALUE
// =================================================================================

// Skema untuk POST /api/leads/:id/custom-fields
export const setCustomFieldValueSchema = z.object({
  body: z.object({
    fieldId: z.string().uuid({ required_error: 'Field ID is required' }),
    value: z.string({ required_error: 'Value is required' }), // Simpan semua sebagai string
  }),
  query: emptyQuery,
  params: z.object({
    id: z.string().uuid('Invalid Lead ID format'), // Ini adalah leadId
  }),
});