import { z } from 'zod';

export const createGadDesignSchema = z.object({
  installationProjectId: z.number().int().positive(),
  preparedById: z.number().int().positive().optional(),
  fileUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateGadDesignSchema = z.object({
  fileUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export const reviewGadDesignSchema = z.object({
  revisionNotes: z.string().min(1).max(1000),
});

export const listGadDesignsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  installationProjectId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateGadDesignInput = z.infer<typeof createGadDesignSchema>;
export type UpdateGadDesignInput = z.infer<typeof updateGadDesignSchema>;
