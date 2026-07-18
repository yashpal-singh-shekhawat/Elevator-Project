import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listAmcContractsQuerySchema = listQuerySchema.extend({
  customerId: z.coerce.number().int().positive().optional(),
  liftId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional()
});

export const createAmcContractSchema = z
  .object({
    contractNumber: z.string().trim().min(1),
    customerId: z.coerce.number().int().positive(),
    liftId: z.coerce.number().int().positive(),
    statusId: z.coerce.number().int().positive(),
    serviceTypeId: z.coerce.number().int().positive(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    contractValue: z.coerce.number().positive().optional(),
    numberOfServicesPerYear: z.coerce.number().int().positive().default(4),
    tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
    autoRenew: z.boolean().default(false)
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'endDate must be after startDate',
    path: ['endDate']
  });

// contractNumber/customerId/liftId are structural — not editable after creation.
export const updateAmcContractSchema = z.object({
  statusId: z.coerce.number().int().positive().optional(),
  serviceTypeId: z.coerce.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  contractValue: z.coerce.number().positive().optional(),
  numberOfServicesPerYear: z.coerce.number().int().positive().optional(),
  tier: z.enum(['BASIC', 'STANDARD', 'PREMIUM']).optional(),
  autoRenew: z.boolean().optional()
});

export type ListAmcContractsQuery = z.infer<typeof listAmcContractsQuerySchema>;
export type CreateAmcContractInput = z.infer<typeof createAmcContractSchema>;
export type UpdateAmcContractInput = z.infer<typeof updateAmcContractSchema>;
