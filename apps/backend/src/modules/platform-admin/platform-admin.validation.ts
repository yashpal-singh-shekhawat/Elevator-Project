import { z } from 'zod';

export const platformLoginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Shared optional-profile fields for create + update. Empty strings are coerced
// to undefined so the client can send blanks without tripping validators.
const optionalTrimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .optional()
    .or(z.literal('').transform(() => undefined));

const contactPerson = optionalTrimmed(120, 'Contact person');
const phone = optionalTrimmed(30, 'Phone');
const address = optionalTrimmed(255, 'Address');
const email = z
  .string()
  .trim()
  .email('A valid email is required')
  .max(160)
  .optional()
  .or(z.literal('').transform(() => undefined));
// Base64 data URL for the logo; the service validates mime/size on decode.
const logoBase64 = z.string().max(3_500_000, 'Logo image is too large').optional();

export const createTenantSchema = z.object({
  name: z.string().trim().min(2, 'Company name is required').max(120),
  companyCode: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]{2,64}$/i, 'Company code must be 2-64 chars: letters, numbers, or dashes'),
  contactPerson,
  email,
  phone,
  address,
  logoBase64
});

export const updateTenantSchema = z
  .object({
    name: z.string().trim().min(2, 'Company name is required').max(120).optional(),
    contactPerson,
    email,
    phone,
    address,
    logoBase64
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No fields provided to update' });

export const setTenantStatusSchema = z.object({
  isActive: z.boolean()
});

export const listTenantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export type PlatformLoginInput = z.infer<typeof platformLoginSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type SetTenantStatusInput = z.infer<typeof setTenantStatusSchema>;
export type ListTenantsQuery = z.infer<typeof listTenantsQuerySchema>;
