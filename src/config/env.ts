import "dotenv/config";
import { z } from "zod";
import { SharedEnvSchema } from "./shared-env.js";

const EnvSchema = SharedEnvSchema.extend({
  PORT: z.coerce.number().int().positive().default(3000),
  HTTP_INTERNAL_API_KEY: z.string().trim().min(16),
  HTTP_GATEWAY_API_KEY: z.string().trim().min(16),
});

export const env = EnvSchema.parse(process.env);
