import type { PoolClient } from "pg";
import { pool, withTransaction } from "../../db/index.js";
import type {
  CreateCompanyCustomerBodySchema,
  ResolveCompanyCustomerBodySchema,
} from "./schemas.js";
import { ConflictError } from "../../lib/errors.js";
import type { z } from "zod";

type ResolveInput = z.infer<typeof ResolveCompanyCustomerBodySchema>;
type CreateInput = z.infer<typeof CreateCompanyCustomerBodySchema>;

export interface CompanyCustomerRecord {
  companyCustomerId: string;
  companyId: string;
  customerId: string;
  customerName: string | null;
  channel: string;
  platformUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedCompanyCustomerIds {
  customerId: string;
  companyCustomerId: string;
}

function mapRow(row: Record<string, unknown>): CompanyCustomerRecord {
  return {
    companyCustomerId: String(row.company_customer_id),
    companyId: String(row.company_id),
    customerId: String(row.customer_id),
    customerName: (row.customer_name as string | null) ?? null,
    channel: String(row.channel),
    platformUserId: String(row.platform_user_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function resolveCompanyCustomerIds(
  client: PoolClient,
  companyId: string,
  input: ResolveInput,
): Promise<ResolvedCompanyCustomerIds> {
  const customerResult = await client.query(
    `
    insert into public.customers (
      name,
      channel,
      platform_user_id
    )
    values ($1, $2, $3)
    on conflict (channel, platform_user_id)
    do update
      set name = coalesce(excluded.name, public.customers.name),
          updated_at = now()
    returning id
    `,
    [input.customerName ?? null, input.channel, input.platformUserId],
  );

  const customerId = String(customerResult.rows[0]!.id);

  const companyCustomerId = await linkExistingCustomer(client, companyId, customerId);

  return {
    customerId,
    companyCustomerId,
  };
}

async function linkExistingCustomer(
  client: PoolClient,
  companyId: string,
  customerId: string,
): Promise<string> {
  const upsert = await client.query(
    `
    insert into public.company_customers (company_id, customer_id)
    values ($1, $2)
    on conflict (company_id, customer_id)
    do update
      set updated_at = now()
    returning id
    `,
    [companyId, customerId],
  );

  return String(upsert.rows[0]!.id);
}

async function selectCompanyCustomer(
  client: PoolClient,
  companyId: string,
  companyCustomerId: string,
): Promise<CompanyCustomerRecord> {
  const result = await client.query(
    `
    select
      cc.id as company_customer_id,
      cc.company_id,
      cc.customer_id,
      c.name as customer_name,
      c.channel,
      c.platform_user_id,
      cc.created_at,
      cc.updated_at
    from public.company_customers cc
    join public.customers c on c.id = cc.customer_id
    where cc.company_id = $1 and cc.id = $2
    `,
    [companyId, companyCustomerId],
  );

  return mapRow(result.rows[0]!);
}

export async function resolveCompanyCustomer(
  companyId: string,
  input: ResolveInput,
): Promise<CompanyCustomerRecord> {
  return withTransaction(async (client) => {
    const { companyCustomerId } = await resolveCompanyCustomerIds(
      client,
      companyId,
      input,
    );

    return selectCompanyCustomer(client, companyId, companyCustomerId);
  });
}

export async function createCompanyCustomer(
  companyId: string,
  input: CreateInput,
): Promise<CompanyCustomerRecord> {
  return withTransaction(async (client) => {
    const existingCustomer = await client.query(
      `
      select id
      from public.customers
      where channel = $1 and platform_user_id = $2
      `,
      [input.channel, input.platformUserId],
    );

    if (existingCustomer.rowCount) {
      throw new ConflictError(
        "A customer already exists for this channel and platform user ID.",
      );
    }

    const createdCustomer = await client.query(
      `
      insert into public.customers (
        name,
        channel,
        platform_user_id
      )
      values ($1, $2, $3)
      returning id
      `,
      [input.customerName ?? null, input.channel, input.platformUserId],
    );

    const customerId = String(createdCustomer.rows[0]!.id);

    const companyCustomerId = await linkExistingCustomer(
      client,
      companyId,
      customerId,
    );

    return selectCompanyCustomer(client, companyId, companyCustomerId);
  });
}

export async function listCompanyCustomers(
  companyId: string,
): Promise<CompanyCustomerRecord[]> {
  const result = await pool.query(
    `
    select
      cc.id as company_customer_id,
      cc.company_id,
      cc.customer_id,
      c.name as customer_name,
      c.channel,
      c.platform_user_id,
      cc.created_at,
      cc.updated_at
    from public.company_customers cc
    join public.customers c on c.id = cc.customer_id
    where cc.company_id = $1
    order by cc.created_at asc
    `,
    [companyId],
  );

  return result.rows.map(mapRow);
}

export async function getCompanyCustomer(
  companyId: string,
  companyCustomerId: string,
): Promise<CompanyCustomerRecord | null> {
  const result = await pool.query(
    `
    select
      cc.id as company_customer_id,
      cc.company_id,
      cc.customer_id,
      c.name as customer_name,
      c.channel,
      c.platform_user_id,
      cc.created_at,
      cc.updated_at
    from public.company_customers cc
    join public.customers c on c.id = cc.customer_id
    where cc.company_id = $1 and cc.id = $2
    `,
    [companyId, companyCustomerId],
  );

  return result.rowCount ? mapRow(result.rows[0]!) : null;
}

export async function getCompanyCustomerIdByCustomerId(
  companyId: string,
  customerId: string,
): Promise<string | null> {
  const result = await pool.query(
    `
    select id
    from public.company_customers
    where company_id = $1 and customer_id = $2
    `,
    [companyId, customerId],
  );

  return result.rowCount ? String(result.rows[0]!.id) : null;
}
