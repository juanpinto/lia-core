import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import { createCompany, getCompanyOrThrow } from './service.js';
import { CompanyIdParamsSchema, CreateCompanyBodySchema } from './schemas.js';

export const companiesRouter = Router();

companiesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, { body: CreateCompanyBodySchema });
    const company = await createCompany(body);
    ok(res, company, 201);
  }),
);

companiesRouter.get(
  '/:companyId',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CompanyIdParamsSchema });
    const company = await getCompanyOrThrow(params.companyId);
    ok(res, company);
  }),
);
