import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  entityType: z.string().min(1),
  items: z.array(z.object({
    label: z.string().min(1).max(200),
    sortOrder: z.number().int().min(0).default(0),
  })).min(1),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export const applyTemplateSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.number().int().positive(),
});

export const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
