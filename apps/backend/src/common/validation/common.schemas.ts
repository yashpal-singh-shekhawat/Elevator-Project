import { z } from 'zod';

// Shared across every module's GET /:id, PATCH /:id, DELETE /:id routes.
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('id must be a positive integer')
});

export type IdParam = z.infer<typeof idParamSchema>;
