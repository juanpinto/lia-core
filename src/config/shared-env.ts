import "dotenv/config";
import { z } from "zod";

const LogLevelSchema = z
  .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
  .default("info");

export const SharedEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  LOG_LEVEL: LogLevelSchema,
});

export const sharedEnv = SharedEnvSchema.parse(process.env);
