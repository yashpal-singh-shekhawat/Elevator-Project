import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listLiftsQuerySchema = listQuerySchema.extend({
  siteId: z.coerce.number().int().positive().optional(),
  liftTypeId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional()
});

export const createLiftSchema = z.object({
  siteId: z.coerce.number().int().positive(),
  liftTypeId: z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive(),
  serialNumber: z.string().trim().min(1),
  model: z.string().trim().optional(),
  capacityKg: z.coerce.number().int().positive().optional(),
  numberOfFloors: z.coerce.number().int().positive().optional(),
  installationDate: z.coerce.date().optional(),
  warrantyExpiryDate: z.coerce.date().optional()
});

export const updateLiftSchema = createLiftSchema.omit({ siteId: true }).partial();

export type ListLiftsQuery = z.infer<typeof listLiftsQuerySchema>;
export type CreateLiftInput = z.infer<typeof createLiftSchema>;
export type UpdateLiftInput = z.infer<typeof updateLiftSchema>;
