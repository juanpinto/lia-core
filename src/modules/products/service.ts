import { insertProduct, listProducts, searchProducts } from './repository.js';
import type { CreateProductBody } from './schemas.js';

export async function createProduct(companyId: string, input: CreateProductBody) {
  return insertProduct(companyId, input);
}

export async function getProducts(companyId: string) {
  return listProducts(companyId);
}

export async function searchCompanyProducts(companyId: string, query?: string) {
  if (!query) {
    return listProducts(companyId);
  }
  return searchProducts(companyId, query);
}
