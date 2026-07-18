import { z } from 'zod';
import { listQuerySchema } from '@common/utils/pagination';

// Entities that can have file attachments (completion certificates, sign-off
// evidence, visit reports/photos). Add an entry here + a case in
// file.service.ts's assertParentEntityExists to onboard a new one.
export const FILE_ENTITY_TYPES = ['INSTALLATION_PROJECT', 'INSTALLATION_MILESTONE', 'AMC_VISIT'] as const;
export const fileEntityTypeSchema = z.enum(FILE_ENTITY_TYPES);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB — keeps S3 storage/transfer cost predictable

export const listFilesQuerySchema = listQuerySchema.extend({
  entityType: fileEntityTypeSchema,
  entityId: z.coerce.number().int().positive()
});

export const presignUploadSchema = z.object({
  entityType: fileEntityTypeSchema,
  entityId: z.coerce.number().int().positive(),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().positive().max(MAX_FILE_SIZE_BYTES, 'File exceeds the 25MB limit')
});

export const confirmUploadSchema = z.object({
  entityType: fileEntityTypeSchema,
  entityId: z.coerce.number().int().positive(),
  fileKey: z.string().trim().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  sizeBytes: z.coerce.number().int().positive().max(MAX_FILE_SIZE_BYTES, 'File exceeds the 25MB limit')
});

export const FILE_VIEW_PERMISSION: Record<(typeof FILE_ENTITY_TYPES)[number], string> = {
  INSTALLATION_PROJECT: 'installation.view',
  INSTALLATION_MILESTONE: 'installation.view',
  AMC_VISIT: 'amc.view'
};

export const FILE_MANAGE_PERMISSION: Record<(typeof FILE_ENTITY_TYPES)[number], string> = {
  INSTALLATION_PROJECT: 'installation.update',
  INSTALLATION_MILESTONE: 'installation.update',
  AMC_VISIT: 'amc.visit.log'
};

export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type ConfirmUploadInput = z.infer<typeof confirmUploadSchema>;
