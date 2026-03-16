import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import { createProduct, getProducts, searchCompanyProduct } from './service.js';
import { CompanyParamsSchema, CreateProductBodySchema, ProductSearchQuerySchema } from './schemas.js';

export const productsRouter = Router({ mergeParams: true });

productsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: CompanyParamsSchema });
    const products = await getProducts(params.companyId);
    ok(res, products);
  }),
);

productsRouter.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { params, query } = validateRequest(req, { params: CompanyParamsSchema, query: ProductSearchQuerySchema });
    const products = await searchCompanyProduct(params.companyId, query.q);
    ok(res, products);
  }),
);

productsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: CreateProductBodySchema });
    const product = await createProduct(params.companyId, body);
    ok(res, product, 201);
  }),
);
