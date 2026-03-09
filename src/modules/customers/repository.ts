import type { PoolClient } from 'pg';
import { pool, withTransaction } from '../../db/index.js';
import type { CreateCompanyCustomerBodySchema, ResolveCompanyCustomerBodySchema } from './schemas.js';
import { ConflictError } from '../../lib/errors.js';
import type { z } from 'zod';

type ResolveInput = z.infer<typeof ResolveCompanyCustomerBodySchema>;
type CreateInput = z.infer<typeof CreateCompanyCustomerBodySchema>;

export interface CompanyCustomerRecord {
  companyCustomerId: string;
  companyId: string;
  customerId: string;
  customerName: string | null;
  displayName: string | null;
  channel: string;
  platformUserId: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): CompanyCustomerRecord {
  return {
    companyCustomerId: String(row.company_customer_id),
    companyId: String(row.company_id),
    customerId: String(row.customer_id),
    customerName: (row.customer_name as string | null) ?? null,
    displayName: (row.display_name as string | null) ?? null,
    channel: String(row.channel),
    platformUserId: String(row.platform_user_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

async function linkExistingCustomer(client: PoolClient, companyId: string, customerId: string, input: ResolveInput | CreateInput) {
  const upsert = await client.query(
    `insert into public.company_customers (company_id, customer_id, display_name, metadata)
     values ($1, $2, $3, $4)
     on conflict (company_id, customer_id)
     do update set
       display_name = coalesce(excluded.display_name, public.company_customers.display_name),
       metadata = coalesce(excluded.metadata, public.company_customers.metadata),
       last_seen_at = now()
     returning id`,
    [companyId, customerId, input.displayName ?? null, input.companyCustomerMetadata ?? null],
  );
  return String(upsert.rows[0]!.id);
}

export async function resolveCompanyCustomer(companyId: string, input: ResolveInput): Promise<CompanyCustomerRecord> {
  return withTransaction(async (client) => {
    const identity = await client.query(
      `select ci.customer_id
       from public.customer_identities ci
       where ci.channel = $1 and ci.platform_user_id = $2`,
      [input.channel, input.platformUserId],
    );

    let customerId: string;
    if (identity.rowCount) {
      customerId = String(identity.rows[0]!.customer_id);
      await client.query(
        `update public.customers
         set name = coalesce($2, name), metadata = coalesce($3, metadata)
         where id = $1`,
        [customerId, input.customerName ?? null, input.customerMetadata ?? null],
      );
    } else {
      const createdCustomer = await client.query(
        `insert into public.customers (name, metadata)
         values ($1, $2)
         returning id`,
        [input.customerName ?? null, input.customerMetadata ?? null],
      );
      customerId = String(createdCustomer.rows[0]!.id);
      await client.query(
        `insert into public.customer_identities (customer_id, channel, platform_user_id)
         values ($1, $2, $3)`,
        [customerId, input.channel, input.platformUserId],
      );
    }

    const companyCustomerId = await linkExistingCustomer(client, companyId, customerId, input);

    const result = await client.query(
      `select cc.id as company_customer_id,
              cc.company_id,
              cc.customer_id,
              c.name as customer_name,
              cc.display_name,
              ci.channel,
              ci.platform_user_id,
              cc.created_at,
              cc.updated_at
       from public.company_customers cc
       join public.customers c on c.id = cc.customer_id
       join public.customer_identities ci on ci.customer_id = cc.customer_id and ci.channel = $2 and ci.platform_user_id = $3
       where cc.id = $1`,
      [companyCustomerId, input.channel, input.platformUserId],
    );

    return mapRow(result.rows[0]!);
  });
}

export async function createCompanyCustomer(companyId: string, input: CreateInput): Promise<CompanyCustomerRecord> {
  return withTransaction(async (client) => {
    const identity = await client.query(
      `select customer_id from public.customer_identities where channel = $1 and platform_user_id = $2`,
      [input.channel, input.platformUserId],
    );
    if (identity.rowCount) {
      throw new ConflictError('A customer identity already exists for this channel and platform user ID.');
    }

    const createdCustomer = await client.query(
      `insert into public.customers (name, metadata)
       values ($1, $2)
       returning id`,
      [input.customerName ?? null, input.customerMetadata ?? null],
    );

    const customerId = String(createdCustomer.rows[0]!.id);
    await client.query(
      `insert into public.customer_identities (customer_id, channel, platform_user_id)
       values ($1, $2, $3)`,
      [customerId, input.channel, input.platformUserId],
    );

    const companyCustomerId = await linkExistingCustomer(client, companyId, customerId, input);

    const result = await client.query(
      `select cc.id as company_customer_id,
              cc.company_id,
              cc.customer_id,
              c.name as customer_name,
              cc.display_name,
              ci.channel,
              ci.platform_user_id,
              cc.created_at,
              cc.updated_at
       from public.company_customers cc
       join public.customers c on c.id = cc.customer_id
       join public.customer_identities ci on ci.customer_id = cc.customer_id and ci.channel = $2 and ci.platform_user_id = $3
       where cc.id = $1`,
      [companyCustomerId, input.channel, input.platformUserId],
    );

    return mapRow(result.rows[0]!);
  });
}

export async function listCompanyCustomers(companyId: string): Promise<CompanyCustomerRecord[]> {
  const result = await pool.query(
    `select cc.id as company_customer_id,
            cc.company_id,
            cc.customer_id,
            c.name as customer_name,
            cc.display_name,
            ci.channel,
            ci.platform_user_id,
            cc.created_at,
            cc.updated_at
     from public.company_customers cc
     join public.customers c on c.id = cc.customer_id
     left join lateral (
       select channel, platform_user_id
       from public.customer_identities
       where customer_id = cc.customer_id
       order by created_at asc
       limit 1
     ) ci on true
     where cc.company_id = $1
     order by cc.created_at asc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}

export async function getCompanyCustomer(companyId: string, companyCustomerId: string): Promise<CompanyCustomerRecord | null> {
  const result = await pool.query(
    `select cc.id as company_customer_id,
            cc.company_id,
            cc.customer_id,
            c.name as customer_name,
            cc.display_name,
            ci.channel,
            ci.platform_user_id,
            cc.created_at,
            cc.updated_at
     from public.company_customers cc
     join public.customers c on c.id = cc.customer_id
     left join lateral (
       select channel, platform_user_id
       from public.customer_identities
       where customer_id = cc.customer_id
       order by created_at asc
       limit 1
     ) ci on true
     where cc.company_id = $1 and cc.id = $2`,
    [companyId, companyCustomerId],
  );
  return result.rowCount ? mapRow(result.rows[0]!) : null;
}
