import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listInstallationMilestonesQuerySchema = listQuerySchema.extend({
  installationProjectId: z.coerce.number().int().positive()
});

export const createInstallationMilestoneSchema = z.object({
  installationProjectId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1),
  statusId: z.coerce.number().int().positive(),
  remarks: z.string().trim().optional()
});

export const updateInstallationMilestoneSchema = z.object({
  name: z.string().trim().min(1).optional(),
  statusId: z.coerce.number().int().positive().optional(),
  remarks: z.string().trim().optional()
});

export const signOffMilestoneSchema = z.object({
  remarks: z.string().trim().optional()
});

export type ListInstallationMilestonesQuery = z.infer<typeof listInstallationMilestonesQuerySchema>;
export type CreateInstallationMilestoneInput = z.infer<typeof createInstallationMilestoneSchema>;
export type UpdateInstallationMilestoneInput = z.infer<typeof updateInstallationMilestoneSchema>;
export type SignOffMilestoneInput = z.infer<typeof signOffMilestoneSchema>;
