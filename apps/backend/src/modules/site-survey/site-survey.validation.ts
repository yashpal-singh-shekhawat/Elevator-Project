import { z } from 'zod';

export const createSiteSurveySchema = z.object({
  installationProjectId: z.number().int().positive(),
  surveyedById: z.number().int().positive().optional(),
  surveyedAt: z.string().optional(),
  pitDepthMm: z.number().int().positive().optional(),
  shaftWidthMm: z.number().int().positive().optional(),
  shaftDepthMm: z.number().int().positive().optional(),
  overheadClearanceMm: z.number().int().positive().optional(),
  powerAvailability: z.enum(['SINGLE_PHASE', 'THREE_PHASE', 'NOT_AVAILABLE']).optional(),
  powerVoltage: z.number().int().positive().optional(),
  machineRoomAvailable: z.boolean().optional(),
  floorCount: z.number().int().positive().optional(),
  buildingType: z.string().max(100).optional(),
  accessibilityNotes: z.string().max(1000).optional(),
  observations: z.string().max(2000).optional(),
});

export const updateSiteSurveySchema = createSiteSurveySchema.omit({ installationProjectId: true }).partial();

export const listSiteSurveysQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  installationProjectId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateSiteSurveyInput = z.infer<typeof createSiteSurveySchema>;
export type UpdateSiteSurveyInput = z.infer<typeof updateSiteSurveySchema>;
