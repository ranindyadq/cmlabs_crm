// File: src/validations/search.schema.js

import { z } from 'zod';

const emptyBody = z.object({}).strict();
const emptyParams = z.object({}).strict();

// =================================================================================
// 1. GLOBAL SEARCH
// =================================================================================

// Skema untuk GET /api/search
export const globalSearchSchema = z.object({
  query: z.object({
    q: z
      .string({ required_error: 'Search query "q" is required' })
      .min(1, 'Search query cannot be empty'),
  }),
  body: emptyBody,
  params: emptyParams,
});