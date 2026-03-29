import { afterEach, describe, expect, it } from "vitest";
import {
  cleanTables,
  createTestCompany,
  createTestUser,
  loginAndGetToken,
  request,
} from "./helpers.js";

afterEach(async () => {
  await cleanTables("company_users", "companies");
});

describe("POST /v1/dashboard/auth/login", () => {
  it("returns a JWT and user info on valid credentials", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");

    const res = await request
      .post("/v1/dashboard/auth/login")
      .send({ email: "admin@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe("admin@test.com");
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("returns 401 on wrong password", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");

    const res = await request
      .post("/v1/dashboard/auth/login")
      .send({ email: "admin@test.com", password: "wrong" });

    expect(res.status).toBe(401);
  });

  it("returns 401 on unknown email", async () => {
    const res = await request
      .post("/v1/dashboard/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid email format", async () => {
    const res = await request
      .post("/v1/dashboard/auth/login")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("GET /v1/dashboard/auth/me", () => {
  it("returns the authenticated user", async () => {
    const company = await createTestCompany();
    await createTestUser(company.id, "admin@test.com", "password123");
    const token = await loginAndGetToken("admin@test.com", "password123");

    const res = await request
      .get("/v1/dashboard/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe("admin@test.com");
    expect(res.body.data.companyId).toBe(company.id);
  });

  it("returns 401 without token", async () => {
    const res = await request.get("/v1/dashboard/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with invalid token", async () => {
    const res = await request
      .get("/v1/dashboard/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});
