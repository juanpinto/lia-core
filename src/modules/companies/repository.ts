import { pool } from '../../db/index.js';
import type { CreateCompanyBody } from './schemas.js';

export interface CompanyRecord {
  id: string;
  name: string;
  timezone: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): CompanyRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    timezone: String(row.timezone),
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertCompany(input: CreateCompanyBody): Promise<CompanyRecord> {
  const result = await pool.query(
    `insert into public.companies (name, timezone, metadata)
     values ($1, $2, $3)
     returning id, name, timezone, metadata, created_at, updated_at`,
    [input.name, input.timezone, input.metadata ?? null],
  );
  return mapRow(result.rows[0]!);
}

export async function findCompanyById(companyId: string): Promise<CompanyRecord | null> {
  const result = await pool.query(
    `select id, name, timezone, metadata, created_at, updated_at
     from public.companies
     where id = $1`,
    [companyId],
  );
  return result.rowCount ? mapRow(result.rows[0]!) : null;
}
