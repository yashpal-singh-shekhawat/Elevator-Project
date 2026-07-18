import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listAmcVisitsQuerySchema = listQuerySchema.extend({
  amcContractId: z.coerce.number().int().positive().optional(),
  liftId: z.coerce.number().int().positive().optional(),
  technicianId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional()
});

export const createAmcVisitSchema = z.object({
  amcContractId: z.coerce.number().int().positive(),
  amcScheduleId: z.coerce.number().int().positive().optional(), // omit for ad-hoc/breakdown visits
  liftId: z.coerce.number().int().positive(),
  serviceTypeId: z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive(),
  technicianId: z.coerce.number().int().positive().optional(),
  visitDate: z.coerce.date()
});

export const updateAmcVisitSchema = z.object({
  statusId: z.coerce.number().int().positive().optional(),
  technicianId: z.coerce.number().int().positive().nullable().optional(),
  visitDate: z.coerce.date().optional(),
  findings: z.string().trim().optional(),
  actionsTaken: z.string().trim().optional(),
  nextServiceDate: z.coerce.date().optional()
});

export type ListAmcVisitsQuery = z.infer<typeof listAmcVisitsQuerySchema>;
export type CreateAmcVisitInput = z.infer<typeof createAmcVisitSchema>;
export type UpdateAmcVisitInput = z.infer<typeof updateAmcVisitSchema>;
