import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Wrap every async controller method with this — otherwise a thrown/rejected
// error inside an async function never reaches Express's error middleware.
export function asyncHandler(handler: AsyncRouteHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
