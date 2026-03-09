import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { requestContext } from './lib/request-context.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerRoutes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);
  app.use(pinoHttp({ logger, customProps: (req: { requestId?: string }) => ({ requestId: req.requestId }) }));

  registerRoutes(app);
  app.use(errorHandler);

  return app;
}
