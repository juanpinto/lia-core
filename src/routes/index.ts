import { Router, type Express } from "express";
import { requireHttpService } from "../auth/http.js";
import { healthRouter } from "./health.js";
import { companiesRouter } from "../modules/companies/routes.js";
import { channelAccountsRouter } from "../modules/channel-accounts/routes.js";
import { customersRouter } from "../modules/customers/routes.js";
import { productsRouter } from "../modules/products/routes.js";
import { appointmentsRouter } from "../modules/appointments/routes.js";

export function registerRoutes(app: Express): void {
  const internalApiRouter = Router();

  internalApiRouter.use("/companies", companiesRouter);
  internalApiRouter.use(
    "/companies/:companyId/channel-accounts",
    channelAccountsRouter,
  );
  internalApiRouter.use("/companies/:companyId/customers", customersRouter);
  internalApiRouter.use("/companies/:companyId/products", productsRouter);
  internalApiRouter.use(
    "/companies/:companyId/appointments",
    appointmentsRouter,
  );

  app.use("/health", healthRouter);
  app.use("/v1", requireHttpService("internal"), internalApiRouter);
}
