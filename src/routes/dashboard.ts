import { Router } from "express";
import { requireDashboardAuth, requireCompanyAccess } from "../auth/jwt.js";
import { authRouter } from "../modules/auth/routes.js";
import { conversationsRouter } from "../modules/conversations/routes.js";
import { appointmentsRouter } from "../modules/appointments/routes.js";
import { customersRouter } from "../modules/customers/routes.js";

export function registerDashboardRoutes(app: import("express").Express): void {
  const dashboardRouter = Router();

  // Auth routes — no company scoping needed
  dashboardRouter.use("/auth", authRouter);

  // Company-scoped routes — require valid JWT + matching companyId
  const companyRouter = Router({ mergeParams: true });
  companyRouter.use(requireDashboardAuth, requireCompanyAccess);
  companyRouter.use("/conversations", conversationsRouter);
  companyRouter.use("/appointments", appointmentsRouter);
  companyRouter.use("/customers", customersRouter);

  dashboardRouter.use("/companies/:companyId", companyRouter);

  app.use("/v1/dashboard", dashboardRouter);
}
