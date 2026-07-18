import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

export const listInstallationTasksQuerySchema = listQuerySchema.extend({
  installationProjectId: z.coerce.number().int().positive(),
  statusId: z.coerce.number().int().positive().optional(),
  assignedToId: z.coerce.number().int().positive().optional()
});

export const createInstallationTaskSchema = z.object({
  installationProjectId: z.coerce.number().int().positive(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  statusId: z.coerce.number().int().positive(),
  sequence: z.coerce.number().int().default(0),
  assignedToId: z.coerce.number().int().positive().optional(),
  dueDate: z.coerce.date().optional()
});

export const updateInstallationTaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  sequence: z.coerce.number().int().optional(),
  assignedToId: z.coerce.number().int().positive().nullable().optional(),
  dueDate: z.coerce.date().optional()
});

export type ListInstallationTasksQuery = z.infer<typeof listInstallationTasksQuerySchema>;
export type CreateInstallationTaskInput = z.infer<typeof createInstallationTaskSchema>;
export type UpdateInstallationTaskInput = z.infer<typeof updateInstallationTaskSchema>;
