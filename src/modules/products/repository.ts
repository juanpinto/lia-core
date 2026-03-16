import { pool } from '../../db/index.js';
import type { CreateProductBody } from './schemas.js';

export interface ProductRecord {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  active: boolean;
  price: number | null;
  durationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): ProductRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    name: String(row.name),
    description: (row.description as string | null) ?? null,
    active: Boolean(row.active),
    price: (row.price as number | null) ?? null,
    durationMinutes: (row.duration_minutes as number | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertProduct(companyId: string, input: CreateProductBody): Promise<ProductRecord> {
  const result = await pool.query(
    `insert into public.products
      (company_id, name, description, active, price, duration_minutes)
     values ($1, $2, $3, $4, $5, $6)
     returning id, company_id, name, description, active, price, duration_minutes, created_at, updated_at`,
    [
      companyId,
      input.name,
      input.description ?? null,
      input.active,
      input.price ?? null,
      input.durationMinutes ?? null,
    ],
  );
  return mapRow(result.rows[0]!);
}

export async function listProducts(companyId: string): Promise<ProductRecord[]> {
  const result = await pool.query(
    `select id, company_id, name, description, active, price, duration_minutes, created_at, updated_at
     from public.products
     where company_id = $1
     order by name asc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}

export async function listActiveProducts(companyId: string): Promise<ProductRecord[]> {
  const result = await pool.query(
    `select id, company_id, name, description, active, price, duration_minutes, created_at, updated_at
     from public.products
     where company_id = $1
       and active = true
     order by name asc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}

export async function searchProducts(companyId: string, query: string): Promise<ProductRecord[]> {
  const result = await pool.query(
    `select id, company_id, name, description, active, price, duration_minutes, created_at, updated_at
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
