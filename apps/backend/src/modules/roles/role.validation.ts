import { z } from 'zod';

// A role's machine key: stable, uppercase, used by requireRoles(...) checks and
// embedded in tokens. Kept immutable after creation (only name/description edit).
const roleCode = z
  .string()
  .trim()
  .regex(/^[A-Z][A-Z0-9_]{1,48}$/, 'Code must be UPPER_SNAKE_CASE (letters, numbers, underscore)');

export const createRoleSchema = z.object({
  code: roleCode,
  name: z.string().trim().min(2, 'Name is required').max(80),
  description: z.string().trim().max(255).optional().or(z.literal(''))
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(255).optional().or(z.literal('')),
  isActive: z.boolean().optional()
});

// The checkbox-matrix save: the full desired set of permission codes for a role.
// The service replaces the role's RolePermission rows to match exactly.
export const setRolePermissionsSchema = z.object({
  permissionCodes: z.array(z.string().trim().min(1)).max(500)
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type SetRolePermissionsInput = z.infer<typeof setRolePermissionsSchema>;
