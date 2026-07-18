import { z } from 'zod';

export const createDispatchSchema = z.object({
  manufacturingOrderId: z.number().int().positive(),
  installationProjectId: z.number().int().positive(),
  waybillNumber: z.string().max(100).optional(),
  carrierName: z.string().max(100).optional(),
  estimatedDeliveryDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateDispatchSchema = z.object({
  waybillNumber: z.string().max(100).optional(),
  carrierName: z.string().max(100).optional(),
  estimatedDeliveryDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const validateDeliverySchema = z.object({
  hasException: z.boolean(),
  exceptionNotes: z.string().max(1000).optional(),
});

export const listDispatchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  installationProjectId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type UpdateDispatchInput = z.infer<typeof updateDispatchSchema>;
