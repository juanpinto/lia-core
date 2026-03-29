import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import type { JwtPayload } from "../modules/auth/service.js";

function extractBearerToken(req: Request): string | null {
  const authHeader = req.header("authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token.");
  }
}

export const requireDashboardAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const token = extractBearerToken(req);
  if (!token) {
    next(new UnauthorizedError());
    return;
  }

  const payload = verifyToken(token);
  req.dashboardUser = {
    userId: payload.sub,
    companyId: payload.companyId,
    email: payload.email,
    role: payload.role,
  };
  next();
};

// Use on routes that have :companyId param — ensures user can only access their own company
export const requireCompanyAccess: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { companyId } = req.params;
  if (!companyId) {
    next(new ForbiddenError());
    return;
  }
  if (req.dashboardUser?.companyId !== companyId) {
    next(new ForbiddenError());
    return;
  }
  next();
};
