import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listCustomersQuerySchema = listQuerySchema;

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  billingAddress: z.string().trim().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
