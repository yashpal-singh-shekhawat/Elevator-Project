import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listUsersQuerySchema = listQuerySchema.extend({
  roleId: z.coerce.number().int().positive().optional()
});

export const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  roleId: z.coerce.number().int().positive()
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  phone: z.string().trim().optional(),
  roleId: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional()
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
