import { z } from 'zod';

export const createQuotationSchema = z.object({
  leadId: z.number().int().positive(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  statusId: z.number().int().positive(),
  preparedById: z.number().int().positive().optional(),
  validUntil: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateQuotationSchema = z.object({
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  statusId: z.number().int().positive().optional(),
  validUntil: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  rejectionReason: z.string().max(500).optional(),
});

export const approveQuotationSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const rejectQuotationSchema = z.object({
  rejectionReason: z.string().min(1).max(500),
});

export const listQuotationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  leadId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
});

export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type ListQuotationsQuery = z.infer<typeof listQuotationsQuerySchema>;
