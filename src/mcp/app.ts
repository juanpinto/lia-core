import express, { type Request, type Response } from "express";
import helmet from "helmet";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { randomUUID } from "node:crypto";
import { logger } from "../config/logger.js";
import { requestContext } from "../lib/request-context.js";
import { createLiaCoreMcpServer } from "./createServer.js";
import { mcpEnv } from "./config.js";
import { requireMcpApiKey } from "./auth.js";

export function createMcpHttpApp() {
  const app = createMcpExpressApp({
    host: "0.0.0.0",
    allowedHosts: mcpEnv.allowedHosts,
  });

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ data: { status: "ok" } });
  });

  app.get("/ready", (_req: Request, res: Response) => {
    res.json({ data: { status: "ready" } });
  });

  app.post("/mcp", requireMcpApiKey, async (req: Request, res: Response) => {
    const server = createLiaCoreMcpServer();
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: mcpEnv.MCP_ENABLE_JSON_RESPONSE,
    });

    req.log?.info?.(
      { route: "/mcp", requestId: req.requestId },
      "Handling MCP request.",
    );

    try {
      await server.connect(transport as Transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logger.error(
        { err: error, requestId: req.requestId },
        "Unhandled MCP transport error.",
      );
      if (!res.headersSent) {
        res.status(500).json({
          error: {
            code: "INTERNAL_ERROR",
            message: "Unexpected MCP transport failure.",
          },
        });
      }
    }
  });

  return app;
}
