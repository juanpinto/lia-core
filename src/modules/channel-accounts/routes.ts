import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import { createChannelAccount, getChannelAccounts } from './service.js';
import { CompanyParamsSchema, CreateChannelAccountBodySchema } from './schemas.js';

export const channelAccountsRouter = Router({ mergeParams: true });

channelAccountsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CompanyParamsSchema });
    const accounts = await getChannelAccounts(params.companyId);
    ok(res, accounts);
  }),
);

channelAccountsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: CreateChannelAccountBodySchema });
    const account = await createChannelAccount(params.companyId, body);
    ok(res, account, 201);
  }),
);
