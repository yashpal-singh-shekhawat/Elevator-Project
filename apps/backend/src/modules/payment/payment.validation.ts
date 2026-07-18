import { z } from 'zod';

export const createPaymentSchema = z.object({
  entityType: z.enum(['QUOTATION', 'INVOICE']),
  entityId: z.number().int().positive(),
  quotationId: z.number().int().positive().optional(),
  invoiceId: z.number().int().positive().optional(),
  amount: z.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'CHEQUE', 'CASH', 'ONLINE']).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const verifyPaymentSchema = z.object({
  notes: z.string().max(500).optional(),
});

export const listPaymentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.enum(['QUOTATION', 'INVOICE']).optional(),
  entityId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsQuerySchema>;
