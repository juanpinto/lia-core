import { afterAll } from "vitest";
import supertest from "supertest";
import { createApp } from "../src/app.js";
import { pool } from "../src/db/index.js";

afterAll(async () => {
  await pool.end();
});

export const app = createApp();
export const request = supertest(app);

// Seed helpers
export async function createTestCompany(name = "Test Co") {
  const result = await pool.query(
    `insert into public.companies (name, timezone) values ($1, 'America/New_York') returning *`,
    [name],
  );
  return result.rows[0] as { id: string; name: string };
}

export async function createTestUser(
  companyId: string,
  email = "admin@test.com",
  password = "password123",
  role: "admin" | "member" = "admin",
) {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.default.hash(password, 4); // low rounds for test speed
  const result = await pool.query(
    `insert into public.company_users (company_id, email, password_hash, role)
     values ($1, $2, $3, $4) returning *`,
    [companyId, email, passwordHash, role],
  );
  return result.rows[0] as { id: string; company_id: string; email: string; role: string };
}

export async function loginAndGetToken(email: string, password: string) {
  const res = await request.post("/v1/dashboard/auth/login").send({ email, password });
  return res.body.data?.token as string;
}

export async function cleanTables(...tables: string[]) {
  for (const table of tables) {
    await pool.query(`truncate public.${table} cascade`);
  }
}
