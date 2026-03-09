import { pool } from '../../db/index.js';
import type { CreateProductBody } from './schemas.js';

export interface ProductRecord {
  id: string;
  companyId: string;
  externalId: string | null;
  name: string;
  description: string | null;
  active: boolean;
  priceCents: number | null;
  durationMinutes: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): ProductRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    externalId: (row.external_id as string | null) ?? null,
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    active: Boolean(row.active),
    priceCents: (row.price_cents as number | null) ?? null,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertProduct(companyId: string, input: CreateProductBody): Promise<ProductRecord> {
  const result = await pool.query(
    `insert into public.products
      (company_id, external_id, name, description, active, price_cents, duration_minutes, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id, company_id, external_id, name, description, active, price_cents, duration_minutes, metadata, created_at, updated_at`,
    [
      companyId,
      input.externalId ?? null,
      input.name,
      input.description ?? null,
      input.active,
      input.priceCents ?? null,
      input.durationMinutes ?? null,
      input.metadata ?? null,
    ],
  );
  return mapRow(result.rows[0]!);
}

export async function listProducts(companyId: string): Promise<ProductRecord[]> {
  const result = await pool.query(
    `select id, company_id, external_id, name, description, active, price_cents, duration_minutes, metadata, created_at, updated_at
     from public.products
     where company_id = $1
     order by name asc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}

export async function searchProducts(companyId: string, query: string): Promise<ProductRecord[]> {
  const result = await pool.query(
    `select id, company_id, external_id, name, description, active, price_cents, duration_minutes, metadata, created_at, updated_at
     from public.products
     where company_id = $1
       and active = true
       and (name ilike $2 or coalesce(description, '') ilike $2)
     order by name asc
     limit 25`,
    [companyId, `%${query}%`],
  );
  return result.rows.map(mapRow);
}
