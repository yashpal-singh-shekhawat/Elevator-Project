import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listSitesQuerySchema = listQuerySchema.extend({
  customerId: z.coerce.number().int().positive().optional()
});

export const createSiteSchema = z.object({
  customerId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  pincode: z.string().trim().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

export const updateSiteSchema = createSiteSchema.omit({ customerId: true }).partial();

export type ListSitesQuery = z.infer<typeof listSitesQuerySchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
