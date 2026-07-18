import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listInstallationProjectsQuerySchema = listQuerySchema.extend({
  customerId: z.coerce.number().int().positive().optional(),
  siteId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  assignedEngineerId: z.coerce.number().int().positive().optional()
});

export const createInstallationProjectSchema = z.object({
  projectCode: z.string().trim().min(1),
  customerId: z.coerce.number().int().positive(),
  siteId: z.coerce.number().int().positive(),
  liftTypeId: z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive(),
  assignedEngineerId: z.coerce.number().int().positive().optional(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional()
});

// customerId/siteId/liftTypeId/projectCode are structural identity fields —
// not editable after creation (consistent with how Lift/Site treat their parent FK).
export const updateInstallationProjectSchema = z.object({
  statusId: z.coerce.number().int().positive().optional(),
  assignedEngineerId: z.coerce.number().int().positive().nullable().optional(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
  actualStartDate: z.coerce.date().optional(),
  actualEndDate: z.coerce.date().optional()
});

export const completeInstallationProjectSchema = z.object({
  serialNumber: z.string().trim().min(1),
  model: z.string().trim().optional(),
  capacityKg: z.coerce.number().int().positive().optional(),
  numberOfFloors: z.coerce.number().int().positive().optional(),
  installationDate: z.coerce.date().optional(),
  warrantyExpiryDate: z.coerce.date().optional()
});

export type ListInstallationProjectsQuery = z.infer<typeof listInstallationProjectsQuerySchema>;
export type CreateInstallationProjectInput = z.infer<typeof createInstallationProjectSchema>;
export type UpdateInstallationProjectInput = z.infer<typeof updateInstallationProjectSchema>;
export type CompleteInstallationProjectInput = z.infer<typeof completeInstallationProjectSchema>;
