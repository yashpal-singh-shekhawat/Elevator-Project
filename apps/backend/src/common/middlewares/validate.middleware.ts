import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError } from '@common/errors';

type ValidationSource = 'body' | 'query' | 'params';

function formatZodError(error: ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    formatted[issue.path.join('.') || '(root)'] = issue.message;
  }
  return formatted;
}

/**
 * validate(schema, 'body') parses & replaces req.body with the Zod-parsed
 * (and coerced/defaulted) result, or forwards a ValidationError with a
 * field-level breakdown to the global error handler.
 *
 * Accepts any Zod schema (ZodTypeAny) — not just ZodObject — so schemas that
 * use .refine()/.transform() (which produce a ZodEffects wrapper) work too.
 */
export function validate(schema: ZodTypeAny, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(new ValidationError('Request validation failed', formatZodError(result.error)));
      return;
    }

    req[source] = result.data;
    next();
  };
}
