import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listLiftTypesQuerySchema = listQuerySchema;

export const createLiftTypeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Z_]+$/, 'code must be UPPER_SNAKE_CASE'),
  name: z.string().trim().min(1)
});

export const updateLiftTypeSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional()
});

export type CreateLiftTypeInput = z.infer<typeof createLiftTypeSchema>;
export type UpdateLiftTypeInput = z.infer<typeof updateLiftTypeSchema>;
