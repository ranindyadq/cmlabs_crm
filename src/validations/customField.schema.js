// File: src/validations/customField.schema.js

import { z } from 'zod';

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
});
