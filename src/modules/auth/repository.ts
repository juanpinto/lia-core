import { pool } from "../../db/index.js";

export interface CompanyUserRecord {
  id: string;
  companyId: string;
  email: string;
  passwordHash: string;
  role: "admin" | "member";
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): CompanyUserRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    email: String(row.email),
    passwordHash: String(row.password_hash),
    role: row.role as "admin" | "member",
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function findUserByEmail(
  email: string,
): Promise<CompanyUserRecord | null> {
  const result = await pool.query(
    `select * from public.company_users where email = $1`,
    [email.toLowerCase().trim()],
  );
  return result.rowCount ? mapRow(result.rows[0]!) : null;
}

export async function findUserById(
  id: string,
): Promise<CompanyUserRecord | null> {
  const result = await pool.query(
    `select * from public.company_users where id = $1`,
    [id],
  );
  return result.rowCount ? mapRow(result.rows[0]!) : null;
}

export async function createUser(input: {
  companyId: string;
  email: string;
  passwordHash: string;
  role: "admin" | "member";
}): Promise<CompanyUserRecord> {
  const result = await pool.query(
    `insert into public.company_users (company_id, email, password_hash, role)
     values ($1, $2, $3, $4)
     returning *`,
    [input.companyId, input.email.toLowerCase().trim(), input.passwordHash, input.role],
  );
  return mapRow(result.rows[0]!);
}
