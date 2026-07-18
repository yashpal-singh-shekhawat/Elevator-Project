import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listAmcSchedulesQuerySchema = listQuerySchema.extend({
  amcContractId: z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive().optional()
});

export const createAmcScheduleSchema = z.object({
  amcContractId: z.coerce.number().int().positive(),
  serviceTypeId: z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive(),
  scheduledDate: z.coerce.date()
});

export const updateAmcScheduleSchema = z.object({
  serviceTypeId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  scheduledDate: z.coerce.date().optional()
});

// Bulk-generates `numberOfServicesPerYear` (from the contract) evenly spaced
// PLANNED schedules between the contract's startDate and endDate.
export const generateAmcSchedulesSchema = z.object({
  amcContractId: z.coerce.number().int().positive(),
  serviceTypeId: z.coerce.number().int().positive().optional() // defaults to the contract's own serviceTypeId
});

export type ListAmcSchedulesQuery = z.infer<typeof listAmcSchedulesQuerySchema>;
export type CreateAmcScheduleInput = z.infer<typeof createAmcScheduleSchema>;
export type UpdateAmcScheduleInput = z.infer<typeof updateAmcScheduleSchema>;
export type GenerateAmcSchedulesInput = z.infer<typeof generateAmcSchedulesSchema>;
