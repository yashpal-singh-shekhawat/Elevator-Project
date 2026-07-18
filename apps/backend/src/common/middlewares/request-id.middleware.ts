import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const REQUEST_ID_HEADER = 'x-request-id';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(REQUEST_ID_HEADER);
  req.requestId = incoming && incoming.length > 0 ? incoming : uuidv4();
  res.setHeader(REQUEST_ID_HEADER, req.requestId);
  next();
}
