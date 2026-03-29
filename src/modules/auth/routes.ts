import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/http.js";
import { validateRequest } from "../../lib/validate.js";
import { requireDashboardAuth } from "../../auth/jwt.js";
import { loginService, getMeService, createUserService } from "./service.js";
import { LoginBodySchema, CreateUserBodySchema } from "./schemas.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, { body: LoginBodySchema });
    const result = await loginService(body);
    ok(res, result);
  }),
);

authRouter.get(
  "/me",
  requireDashboardAuth,
  asyncHandler(async (req, res) => {
    const user = await getMeService(req.dashboardUser!.userId);
    ok(res, user);
  }),
);

// Internal-only: create a company user (called during onboarding)
authRouter.post(
  "/users",
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, { body: CreateUserBodySchema });
    const user = await createUserService(body);
    ok(res, user, 201);
  }),
);
