import { afterEach, describe, expect, it } from "vitest";
import { pool } from "../../src/db/index.js";
import {
  cleanTables,
  createTestCompany,
  createTestUser,
  loginAndGetToken,
  request,
} from "../helpers.js";

let seedCounter = 0;

async function seedAppointment(
  companyId: string,
  status: "scheduled" | "completed" | "cancelled" = "scheduled",
) {
  const phone = `+521${String(++seedCounter).padStart(10, "0")}`;
  const customerRes = await pool.query(
    `insert into public.customers (channel, platform_user_id, name)
     values ('whatsapp', $1, 'Appt Customer') returning id`,
    [phone],
  );
  const customerId = customerRes.rows[0].id as string;

  const ccRes = await pool.query(
    `insert into public.company_customers (company_id, customer_id) values ($1, $2) returning id`,
    [companyId, customerId],
  );
  const companyCustomerId = ccRes.rows[0].id as string;

  const product = await pool.query(
    `insert into public.products (company_id, name, price, duration_minutes)
     values ($1, 'Corte', 200, 45) returning id`,
    [companyId],
  );
  const productId = product.rows[0].id as string;

  const aptRes = await pool.query(
    `insert into public.appointments
      (company_id, company_customer_id, start_at_utc, end_at_utc, status, created_via)
     values ($1, $2, now() + interval '1 day', now() + interval '1 day 1 hour', $3, 'whatsapp')
     returning id`,
    [companyId, companyCustomerId, status],
  );
  const appointmentId = aptRes.rows[0].id as string;

  await pool.query(
    `insert into public.appointment_products (company_id, appointment_id, product_id)
     values ($1, $2, $3)`,
    [companyId, appointmentId, productId],
  );

  return { customerId, companyCustomerId, appointmentId, productId };
}

afterEach(async () => {
  await cleanTables(
    "company_users",
    "appointment_products",
    "appointments",
    "products",
    "company_customers",
    "customers",
    "companies",
  );
});

describe("GET /v1/dashboard/companies/:companyId/appointments", () => {
  it("returns all appointments for the company", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");
    await seedAppointment(company.id);
    const token = await loginAndGetToken("admin@test.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company.id}/appointments`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe("scheduled");
    expect(res.body.data[0].items.length).toBe(1);
  });

  it("filters by status=scheduled", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");
    await seedAppointment(company.id, "scheduled");
    await seedAppointment(company.id, "completed");
    const token = await loginAndGetToken("admin@test.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company.id}/appointments?status=scheduled`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].status).toBe("scheduled");
  });

  it("returns 401 without token", async () => {
    const company = await createTestCompany();
    const res = await request.get(`/v1/dashboard/companies/${company.id}/appointments`);
    expect(res.status).toBe(401);
  });

  it("returns 403 when accessing another company's appointments", async () => {
    const company1 = await createTestCompany("Company 1");
    const company2 = await createTestCompany("Company 2");
    await createTestUser(company1.id, "admin@c1.com", "password123");
    const token = await loginAndGetToken("admin@c1.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company2.id}/appointments`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
