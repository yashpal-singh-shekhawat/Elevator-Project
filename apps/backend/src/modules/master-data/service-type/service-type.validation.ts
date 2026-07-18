import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listServiceTypesQuerySchema = listQuerySchema;

export const createServiceTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Z_]+$/, 'code must be UPPER_SNAKE_CASE'),
  name: z.string().trim().min(1)
});

export const updateServiceTypeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional()
});

export type CreateServiceTypeInput = z.infer<typeof createServiceTypeSchema>;
export type UpdateServiceTypeInput = z.infer<typeof updateServiceTypeSchema>;
