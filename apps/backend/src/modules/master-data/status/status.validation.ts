import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listStatusesQuerySchema = listQuerySchema.extend({
  entityType: z.string().trim().min(1).optional()
});

export const createStatusSchema = z.object({
  entityType: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Z_]+$/, 'code must be UPPER_SNAKE_CASE'),
  label: z.string().trim().min(1),
  color: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().default(0)
});

export const updateStatusSchema = z.object({
  label: z.string().trim().min(1).optional(),
  color: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional()
});

export type ListStatusesQuery = z.infer<typeof listStatusesQuerySchema>;
export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
