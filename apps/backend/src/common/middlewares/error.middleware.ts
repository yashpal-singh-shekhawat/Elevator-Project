import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, NotFoundError } from '@common/errors';
import { ApiResponse } from '@common/responses/api-response';
import { logger } from '@config/logger';
import { env } from '@config/env';

// Mounted after all routers. Any route that calls next(err), or any thrown
// error inside an asyncHandler-wrapped controller, ends up here.
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl}`));
}

function handlePrismaKnownError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002': {
      const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
      return new AppError(`A record with this ${target} already exists`, 409, 'CONFLICT', { target });
    }
    case 'P2025':
      return new AppError('Record not found', 404, 'NOT_FOUND');
    case 'P2003':
      return new AppError('Related record does not exist or cannot be modified', 409, 'FOREIGN_KEY_CONSTRAINT');
    default:
      return new AppError('Database request failed', 400, 'DATABASE_ERROR', { prismaCode: err.code });
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let resolvedError: AppError;

  if (err instanceof AppError) {
    resolvedError = err;
  } else if (err instanceof ZodError) {
    resolvedError = new AppError('Validation failed', 400, 'VALIDATION_ERROR', err.flatten().fieldErrors);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    resolvedError = handlePrismaKnownError(err);
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    resolvedError = new AppError('Invalid database query', 400, 'DATABASE_VALIDATION_ERROR');
  } else {
    resolvedError = new AppError(
      env.NODE_ENV === 'production' ? 'Something went wrong' : (err as Error)?.message ?? 'Unknown error',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  const logPayload = {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode: resolvedError.statusCode,
    tenantId: req.tenantContext?.tenantId,
    userId: req.user?.id
  };

  if (resolvedError.statusCode >= 500) {
    logger.error(`[${req.requestId}] ${resolvedError.message}`, { ...logPayload, stack: (err as Error)?.stack });
  } else {
    logger.warn(`[${req.requestId}] ${resolvedError.message}`, logPayload);
  }

  ApiResponse.error(
    res,
    resolvedError.statusCode,
    resolvedError.code,
    resolvedError.message,
    resolvedError.details,
    req.requestId
  );
}
