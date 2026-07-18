import { Response } from 'express';
import { ApiResponse } from '@common/responses/api-response';
import { ListQuery, buildPaginationMeta } from './pagination';

interface ListResult<T> {
  items: T[];
  totalItems: number;
}

// Every module's "list" controller action reduces to one call to this
// helper — keeps the pagination-meta-building logic in exactly one place.
export async function respondWithList<T>(
  res: Response,
  query: ListQuery,
  fetcher: () => Promise<ListResult<T>>
): Promise<void> {
  const { items, totalItems } = await fetcher();
  ApiResponse.paginated(res, items, buildPaginationMeta(query.page, query.limit, totalItems));
}
