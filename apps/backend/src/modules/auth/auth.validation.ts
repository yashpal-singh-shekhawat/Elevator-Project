import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  // Optional in the body: the tenant is normally taken from the /:companyCode
  // URL param. Accepted here too for direct API clients that don't use the
  // path-prefixed route.
  companyCode: z
    .string()
    .regex(/^[a-z0-9-]{2,64}$/i, 'Invalid company code')
    .optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
