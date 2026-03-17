import { Router } from 'express';
import { isDatabaseHealthy } from '../db/index.js';
import { asyncHandler } from '../lib/async-handler.js';

export const healthRouter = Router();

healthRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const databaseHealthy = await isDatabaseHealthy();

    if (!databaseHealthy) {
      res.status(503).json({
        data: {
          status: 'degraded',
          database: 'unavailable',
        },
      });
      return;
    }

    res.json({
      data: {
        status: 'ok',
        database: 'ok',
      },
    });
  }),
);
