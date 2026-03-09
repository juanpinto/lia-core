import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import {
  createCompanyCustomerService,
  getCompanyCustomerOrThrow,
  listCompanyCustomersService,
  resolveCompanyCustomerService,
} from './service.js';
import {
  CompanyParamsSchema,
  CreateCompanyCustomerBodySchema,
  CustomerParamsSchema,
  ResolveCompanyCustomerBodySchema,
} from './schemas.js';

export const customersRouter = Router({ mergeParams: true });

customersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CompanyParamsSchema });
    const customers = await listCompanyCustomersService(params.companyId);
    ok(res, customers);
  }),
);

customersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: CreateCompanyCustomerBodySchema });
    const customer = await createCompanyCustomerService(params.companyId, body);
    ok(res, customer, 201);
  }),
);

customersRouter.post(
  '/resolve',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: ResolveCompanyCustomerBodySchema });
    const customer = await resolveCompanyCustomerService(params.companyId, body);
    ok(res, customer);
  }),
);

customersRouter.get(
  '/:companyCustomerId',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CustomerParamsSchema });
    const customer = await getCompanyCustomerOrThrow(params.companyId, params.companyCustomerId);
    ok(res, customer);
  }),
);
