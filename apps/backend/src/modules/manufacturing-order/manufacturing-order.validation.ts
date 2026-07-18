import { z } from 'zod';

export const createManufacturingOrderSchema = z.object({
  installationProjectId: z.number().int().positive(),
  notes: z.string().max(1000).optional(),
});

export const updateManufacturingOrderSchema = z.object({
  notes: z.string().max(1000).optional(),
});

export const qcFailSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const listManufacturingOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  installationProjectId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateManufacturingOrderInput = z.infer<typeof createManufacturingOrderSchema>;
export type UpdateManufacturingOrderInput = z.infer<typeof updateManufacturingOrderSchema>;
