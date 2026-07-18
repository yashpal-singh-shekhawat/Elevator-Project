import { z } from 'zod';

export const createServiceTicketSchema = z.object({
  amcContractId: z.number().int().positive(),
  liftId: z.number().int().positive(),
  source: z.enum(['AUTO_PM', 'CLIENT_PORTAL', 'WHATSAPP', 'PHONE', 'MANUAL']),
  categoryTag: z.enum(['PM', 'MECHANICAL', 'ELECTRICAL', 'DOOR', 'SAFETY_CIRCUIT']).optional(),
  priorityFlag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).default('NORMAL'),
  passengerEntrapped: z.boolean().default(false),
  amcScheduleId: z.number().int().positive().optional(),
  findings: z.string().max(2000).optional(),
  recommendations: z.string().max(2000).optional(),
});

export const updateServiceTicketSchema = z.object({
  findings: z.string().max(2000).optional(),
  recommendations: z.string().max(2000).optional(),
  nextServiceDate: z.string().optional(),
});

export const categorizeTicketSchema = z.object({
  categoryTag: z.enum(['PM', 'MECHANICAL', 'ELECTRICAL', 'DOOR', 'SAFETY_CIRCUIT']),
  priorityFlag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
});

export const assignTicketSchema = z.object({
  technicianId: z.number().int().positive(),
});

export const resolveTicketSchema = z.object({
  findings: z.string().min(1).max(2000),
  recommendations: z.string().max(2000).optional(),
  nextServiceDate: z.string().optional(),
});

export const listServiceTicketsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  amcContractId: z.coerce.number().int().positive().optional(),
  statusId: z.coerce.number().int().positive().optional(),
  assignedToId: z.coerce.number().int().positive().optional(),
  priorityFlag: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL']).optional(),
  liftId: z.coerce.number().int().positive().optional(),
});

export type CreateServiceTicketInput = z.infer<typeof createServiceTicketSchema>;
export type UpdateServiceTicketInput = z.infer<typeof updateServiceTicketSchema>;
export type ListServiceTicketsQuery = z.infer<typeof listServiceTicketsQuerySchema>;
