import { z } from 'zod';
import { PaginationMeta } from '@common/responses/api-response';

// Every list endpoint (installations, AMC contracts, lifts, ...) accepts the
// same query shape. Controllers parse req.query with this schema, then hand
// the result to repositories via toPrismaListArgs — no duplicated
// pagination/sorting/search logic per module.
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().trim().optional()
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface PrismaListArgs {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

/**
 * Converts a validated ListQuery into Prisma skip/take/orderBy args.
 * @param query - parsed ListQuery
 * @param allowedSortFields - whitelist of columns that may be sorted on
 * @param defaultSortField - used when sortBy is absent or not whitelisted
 */
export function toPrismaListArgs(
  query: ListQuery,
  allowedSortFields: readonly string[],
  defaultSortField = 'createdAt'
): PrismaListArgs {
  const sortField =
    query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : defaultSortField;

  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: { [sortField]: query.sortOrder }
  };
}

export function buildPaginationMeta(page: number, limit: number, totalItems: number): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / limit))
  };
}

/**
 * Builds a Prisma `OR` clause for case-insensitive search across the given
 * text fields. Returns undefined (omit from where clause) if search is empty.
 */
export function buildSearchWhere(search: string | undefined, fields: readonly string[]) {
  if (!search) return undefined;
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const }
    }))
  };
}
