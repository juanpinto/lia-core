import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env.js";

export type HttpServiceName = "internal" | "gateway";

function extractPresentedToken(req: Request): string | null {
  const authHeader = req.header("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const apiKeyHeader = req.header("x-api-key");
  return apiKeyHeader?.trim() || null;
}

function resolveHttpService(token: string): HttpServiceName | null {
  if (token === env.HTTP_INTERNAL_API_KEY) {
    return "internal";
  }
  if (token === env.HTTP_GATEWAY_API_KEY) {
    return "gateway";
  }
  return null;
}

function sendUnauthorized(res: Response): void {
  res.status(401).json({
    error: {
      code: "UNAUTHORIZED",
      message: "Missing or invalid HTTP API credentials.",
    },
  });
}

function sendForbidden(res: Response, allowedServices: HttpServiceName[]): void {
  res.status(403).json({
    error: {
      code: "FORBIDDEN",
      message: `This route requires one of: ${allowedServices.join(", ")}.`,
    },
  });
}

export function requireHttpService(
  ...allowedServices: HttpServiceName[]
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractPresentedToken(req);
    if (!token) {
      sendUnauthorized(res);
      return;
    }

    const service = resolveHttpService(token);
    if (!service) {
      sendUnauthorized(res);
      return;
    }

    if (!allowedServices.includes(service)) {
      sendForbidden(res, allowedServices);
      return;
    }

    req.serviceAuth = { service };
    next();
  };
}
