import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta } & Record<string, unknown>;
  error: null;
}

interface ErrorBody {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export type ApiResponseBody<T = unknown> = SuccessBody<T> | ErrorBody;

// Every controller responds through this class so the envelope shape
// ({ success, data, meta, error }) never drifts between endpoints.
export class ApiResponse {
  static success<T>(res: Response, data: T, statusCode = 200, meta?: SuccessBody<T>['meta']): Response {
    const body: SuccessBody<T> = { success: true, data, error: null, ...(meta ? { meta } : {}) };
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data: T, meta?: SuccessBody<T>['meta']): Response {
    return ApiResponse.success(res, data, 201, meta);
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static paginated<T>(res: Response, data: T[], pagination: PaginationMeta): Response {
    return ApiResponse.success(res, data, 200, { pagination });
  }

  // Used internally by the global error handler — controllers should throw
  // AppError subclasses instead of calling this directly.
  static error(res: Response, statusCode: number, code: string, message: string, details?: unknown, requestId?: string): Response {
    const body: ErrorBody = { success: false, data: null, error: { code, message, details, requestId } };
    return res.status(statusCode).json(body);
  }
}
