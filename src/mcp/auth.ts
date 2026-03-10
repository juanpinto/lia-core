import type { NextFunction, Request, Response } from "express";
import { mcpEnv } from "./config.js";

function extractPresentedToken(req: Request): string | null {
  const authHeader = req.header("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const apiKeyHeader = req.header("x-mcp-api-key");
  return apiKeyHeader?.trim() || null;
}

export function requireMcpApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = extractPresentedToken(req);
  if (!token || token !== mcpEnv.MCP_API_KEY) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid MCP credentials.",
      },
    });
    return;
  }

  next();
}
