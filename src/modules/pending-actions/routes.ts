import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import {
  createPendingActionService,
  getPendingActionOrThrow,
  listPendingActionsService,
  resolvePendingActionService,
} from './service.js';
import {
  CompanyParamsSchema,
  CreatePendingActionBodySchema,
  PendingActionParamsSchema,
  ResolvePendingActionBodySchema,
} from './schemas.js';

export const pendingActionsRouter = Router({ mergeParams: true });

pendingActionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CompanyParamsSchema });
    const actions = await listPendingActionsService(params.companyId);
    ok(res, actions);
  }),
);

pendingActionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: CreatePendingActionBodySchema });
    const action = await createPendingActionService(params.companyId, body);
    ok(res, action, 201);
  }),
);

pendingActionsRouter.get(
  '/:pendingActionId',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: PendingActionParamsSchema });
    const action = await getPendingActionOrThrow(params.companyId, params.pendingActionId);
    ok(res, action);
  }),
);

pendingActionsRouter.post(
  '/:pendingActionId/resolve',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: PendingActionParamsSchema, body: ResolvePendingActionBodySchema });
    const action = await resolvePendingActionService(params.companyId, params.pendingActionId, body);
    ok(res, action);
  }),
);
