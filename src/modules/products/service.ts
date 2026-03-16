import {
  insertProduct,
  listExistingProductIds,
  listActiveProducts,
  listProducts,
  searchProducts,
} from "./repository.js";
import { ValidationError } from "../../lib/errors.js";
import type { CreateProductBody } from "./schemas.js";

export async function createProduct(
  companyId: string,
  input: CreateProductBody,
) {
  return insertProduct(companyId, input);
}

export async function getProducts(companyId: string) {
  return listProducts(companyId);
}

export async function listActiveCompanyProducts(companyId: string) {
  return listActiveProducts(companyId);
}

export async function searchCompanyProduct(companyId: string, query: string) {
  return searchProducts(companyId, query);
}

export async function assertCompanyProductsExist(
  companyId: string,
  productIds: string[],
) {
  const uniqueProductIds = [...new Set(productIds)];
  const existingProductIds = new Set(
    await listExistingProductIds(companyId, uniqueProductIds),
  );
  const missingProductIds = uniqueProductIds.filter(
    (productId) => !existingProductIds.has(productId),
  );

  if (missingProductIds.length) {
    throw new ValidationError(
      `Products were not found for company ${companyId}: ${missingProductIds.join(", ")}.`,
    );
  }
}
