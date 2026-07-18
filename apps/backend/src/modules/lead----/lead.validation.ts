import { z } from 'zod';

export const createLeadSchema = z.object({
  vertical: z.enum(['INSTALLATION', 'AMC']),
  customerId: z.number().int().positive().optional(),
  siteId: z.number().int().positive().optional(),
  statusId: z.number().int().positive(),
  assignedToId: z.number().int().positive().optional(),
  source: z.enum(['REFERRAL', 'DIRECT', 'CHANNEL_PARTNER', 'WARRANTY_EXPIRY', 'RENEWAL_DUE']).optional(),
  contactName: z.string().min(1).max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  notes: z.string().max(2000).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const assignLeadSchema = z.object({
  assignedToId: z.number().int().positive(),
});

export const transitionLeadSchema = z.object({
  statusId: z.number().int().positive(),
  remarks: z.string().max(1000).optional(),
});

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  vertical: z.enum(['INSTALLATION', 'AMC']).optional(),
  statusId: z.coerce.number().int().positive().optional(),
  assignedToId: z.coerce.number().int().positive().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
