import type { Express } from 'express';
import { healthRouter } from './health.js';
import { companiesRouter } from '../modules/companies/routes.js';
import { channelAccountsRouter } from '../modules/channel-accounts/routes.js';
import { customersRouter } from '../modules/customers/routes.js';
import { productsRouter } from '../modules/products/routes.js';
import { conversationsRouter } from '../modules/conversations/routes.js';
import { appointmentsRouter } from '../modules/appointments/routes.js';
import { pendingActionsRouter } from '../modules/pending-actions/routes.js';

export function registerRoutes(app: Express): void {
  app.use('/health', healthRouter);
  app.use('/v1/companies', companiesRouter);
  app.use('/v1/companies/:companyId/channel-accounts', channelAccountsRouter);
  app.use('/v1/companies/:companyId/customers', customersRouter);
  app.use('/v1/companies/:companyId/products', productsRouter);
  app.use('/v1/companies/:companyId/conversations', conversationsRouter);
  app.use('/v1/companies/:companyId/appointments', appointmentsRouter);
  app.use('/v1/companies/:companyId/pending-actions', pendingActionsRouter);
}
