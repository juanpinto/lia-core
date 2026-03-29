import { afterEach, describe, expect, it } from "vitest";
import { pool } from "../../src/db/index.js";
import {
  cleanTables,
  createTestCompany,
  createTestUser,
  loginAndGetToken,
  request,
} from "../helpers.js";

async function seedConversation(companyId: string) {
  // Create customer
  const customerRes = await pool.query(
    `insert into public.customers (channel, platform_user_id, name)
     values ('whatsapp', '+521234567890', 'Test Customer') returning id`,
  );
  const customerId = customerRes.rows[0].id as string;

  // Link to company
  const ccRes = await pool.query(
    `insert into public.company_customers (company_id, customer_id) values ($1, $2) returning id`,
    [companyId, customerId],
  );
  const companyCustomerId = ccRes.rows[0].id as string;

  // Create conversation
  const convRes = await pool.query(
    `insert into public.conversations (company_id, company_customer_id, channel, status)
     values ($1, $2, 'whatsapp', 'open') returning id`,
    [companyId, companyCustomerId],
  );
  const conversationId = convRes.rows[0].id as string;

  // Add a message
  await pool.query(
    `insert into public.messages
      (company_id, conversation_id, channel, external_message_id, direction, body, role)
     values ($1, $2, 'whatsapp', 'ext-001', 'inbound', 'Hola!', 'user')`,
    [companyId, conversationId],
  );

  return { customerId, companyCustomerId, conversationId };
}

afterEach(async () => {
  await cleanTables("company_users", "conversations", "company_customers", "customers", "companies");
});

describe("GET /v1/dashboard/companies/:companyId/conversations", () => {
  it("returns conversations for the authenticated company", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");
    await seedConversation(company.id);
    const token = await loginAndGetToken("admin@test.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company.id}/conversations`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].channel).toBe("whatsapp");
  });

  it("returns 401 without token", async () => {
    const company = await createTestCompany();
    const res = await request.get(`/v1/dashboard/companies/${company.id}/conversations`);
    expect(res.status).toBe(401);
  });

  it("returns 403 when accessing another company's conversations", async () => {
    const company1 = await createTestCompany("Company 1");
    const company2 = await createTestCompany("Company 2");
    await createTestUser(company1.id, "admin@company1.com", "password123");
    const token = await loginAndGetToken("admin@company1.com", "password123");

    // Try to access company2's conversations with company1's token
    const res = await request
      .get(`/v1/dashboard/companies/${company2.id}/conversations`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("filters by status", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");
    await seedConversation(company.id);
    const token = await loginAndGetToken("admin@test.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company.id}/conversations?status=closed`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });
});

describe("GET /v1/dashboard/companies/:companyId/conversations/:conversationId/messages", () => {
  it("returns messages for a conversation", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");
    const { conversationId } = await seedConversation(company.id);
    const token = await loginAndGetToken("admin@test.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company.id}/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].body).toBe("Hola!");
  });

  it("returns 403 when accessing another company's messages", async () => {
    const company1 = await createTestCompany("Company 1");
    const company2 = await createTestCompany("Company 2");
    await createTestUser(company1.id, "admin@c1.com", "password123");
    const { conversationId } = await seedConversation(company2.id);
    const token = await loginAndGetToken("admin@c1.com", "password123");

    const res = await request
      .get(`/v1/dashboard/companies/${company2.id}/conversations/${conversationId}/messages`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});
