import type { Request } from 'express';
import { ZodError, type ZodType } from 'zod';
import { ValidationError } from './errors.js';

export function parseOrThrow<T>(schema: ZodType<T>, input: unknown): T {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Request validation failed.', error.flatten());
    }
    throw error;
  }
}

export function validateRequest<TParams, TQuery, TBody>(req: Request, schemas: {
  params?: ZodType<TParams>;
  query?: ZodType<TQuery>;
  body?: ZodType<TBody>;
}): { params: TParams; query: TQuery; body: TBody } {
  return {
    params: schemas.params ? parseOrThrow(schemas.params, req.params) : ({} as TParams),
    query: schemas.query ? parseOrThrow(schemas.query, req.query) : ({} as TQuery),
    body: schemas.body ? parseOrThrow(schemas.body, req.body) : ({} as TBody),
  };
}
