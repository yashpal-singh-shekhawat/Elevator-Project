import { AxiosError, AxiosResponse } from 'axios';
import type { ApiResponse, PaginationMeta } from '@lift-saas/shared-types';

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  if (!response.data.success) {
    throw new Error(response.data.error.message);
  }
  return response.data.data;
}

export function unwrapList<T>(response: AxiosResponse<ApiResponse<T[]>>): { items: T[]; meta?: PaginationMeta } {
  const items = unwrap(response);
  return { items, meta: response.data.success ? response.data.meta?.pagination : undefined };
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const error = err.response?.data?.error;
    // Validation errors carry a field->message map in `details`; surface those
    // so the user sees exactly which field failed instead of a generic message.
    if (error?.details && typeof error.details === 'object') {
      const fields = Object.entries(error.details as Record<string, string>)
        .map(([field, message]) => `${field}: ${message}`)
        .join(' · ');
      if (fields) return fields;
    }
    return error?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
