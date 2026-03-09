import { NotFoundError } from '../../lib/errors.js';
import { findCompanyById, insertCompany } from './repository.js';
import type { CreateCompanyBody } from './schemas.js';

export async function createCompany(input: CreateCompanyBody) {
  return insertCompany(input);
}

export async function getCompanyOrThrow(companyId: string) {
  const company = await findCompanyById(companyId);
  if (!company) {
    throw new NotFoundError(`Company ${companyId} was not found.`);
  }
  return company;
}
