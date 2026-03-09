import type { RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../config/logger.js';

export const requestContext: RequestHandler = (req, _res, next) => {
  const requestId = req.header('x-request-id') ?? randomUUID();
  req.requestId = requestId;
  req.log = logger.child({ requestId });
  next();
};
