import "dotenv/config";
import { z } from "zod";

const McpEnvSchema = z.object({
  MCP_PORT: z.coerce.number().int().positive().default(3100),
  MCP_API_KEY: z.string().trim().min(16),
  MCP_ALLOWED_HOSTS: z.string().trim().min(1).default("localhost,127.0.0.1"),
  MCP_ENABLE_JSON_RESPONSE: z
    .string()
    .trim()
    .optional()
    .transform((value) => value !== "false"),
});

const parsed = McpEnvSchema.parse(process.env);

export const mcpEnv = {
  ...parsed,
  allowedHosts: parsed.MCP_ALLOWED_HOSTS.split(",")
    .map((host) => host.trim())
    .filter(Boolean),
};
