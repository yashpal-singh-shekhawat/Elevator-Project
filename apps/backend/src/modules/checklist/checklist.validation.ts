import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

// Module 7 (AMC): added 'AMC_VISIT' now that AmcVisit exists — this was the
// one place that needed to change to onboard the new entity type, exactly
// as planned when this module was built in Module 6.
export const CHECKLIST_ENTITY_TYPES = ['INSTALLATION_TASK', 'AMC_VISIT'] as const;
export const checklistEntityTypeSchema = z.enum(CHECKLIST_ENTITY_TYPES);

// Which permission is required to view/manage checklist items for each
// parent entity type. Used by checklist.routes.ts (list/create, where
// entityType is known up-front from query/body) and by checklist.service.ts
// (update/remove, where entityType is only known after fetching the item).
export const CHECKLIST_VIEW_PERMISSION: Record<(typeof CHECKLIST_ENTITY_TYPES)[number], string> = {
  INSTALLATION_TASK: 'installation.view',
  AMC_VISIT: 'amc.view'
};

export const CHECKLIST_MANAGE_PERMISSION: Record<(typeof CHECKLIST_ENTITY_TYPES)[number], string> = {
  INSTALLATION_TASK: 'installation.update',
  AMC_VISIT: 'amc.visit.log'
};

export const listChecklistItemsQuerySchema = listQuerySchema.extend({
  entityType: checklistEntityTypeSchema,
  entityId: z.coerce.number().int().positive()
});

export const createChecklistItemSchema = z.object({
  entityType: checklistEntityTypeSchema,
  entityId: z.coerce.number().int().positive(),
  label: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().default(0)
});

export const updateChecklistItemSchema = z.object({
  label: z.string().trim().min(1).optional(),
  isChecked: z.boolean().optional(),
  remarks: z.string().trim().optional(),
  sortOrder: z.coerce.number().int().optional()
});

export type ListChecklistItemsQuery = z.infer<typeof listChecklistItemsQuerySchema>;
export type CreateChecklistItemInput = z.infer<typeof createChecklistItemSchema>;
export type UpdateChecklistItemInput = z.infer<typeof updateChecklistItemSchema>;
