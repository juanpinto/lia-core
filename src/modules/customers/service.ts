import { NotFoundError } from '../../lib/errors.js';
import {
  createCompanyCustomer,
  getCompanyCustomer,
  getCompanyCustomerIdByCustomerId,
  listCompanyCustomers,
  resolveCompanyCustomer,
} from './repository.js';
import type { z } from 'zod';
import type { CreateCompanyCustomerBodySchema, ResolveCompanyCustomerBodySchema } from './schemas.js';

type ResolveInput = z.infer<typeof ResolveCompanyCustomerBodySchema>;
type CreateInput = z.infer<typeof CreateCompanyCustomerBodySchema>;

export async function resolveCompanyCustomerService(companyId: string, input: ResolveInput) {
  return resolveCompanyCustomer(companyId, input);
}

export async function createCompanyCustomerService(companyId: string, input: CreateInput) {
  return createCompanyCustomer(companyId, input);
}

export async function listCompanyCustomersService(companyId: string) {
  return listCompanyCustomers(companyId);
}

export async function getCompanyCustomerOrThrow(companyId: string, companyCustomerId: string) {
  const customer = await getCompanyCustomer(companyId, companyCustomerId);
  if (!customer) {
    throw new NotFoundError(`Company customer ${companyCustomerId} was not found for company ${companyId}.`);
  }
  return customer;
}

export async function getCompanyCustomerIdForCustomerOrThrow(companyId: string, customerId: string) {
  const companyCustomerId = await getCompanyCustomerIdByCustomerId(companyId, customerId);
  if (!companyCustomerId) {
    throw new NotFoundError(`Customer ${customerId} was not found for company ${companyId}.`);
  }
  return companyCustomerId;
}
