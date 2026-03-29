import { z } from "zod";

export const LoginBodySchema = z.object({
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(1),
});

export const CreateUserBodySchema = z.object({
  companyId: z.uuid(),
  email: z.string().trim().pipe(z.email()),
  password: z.string().min(8),
  role: z.enum(["admin", "member"]).default("admin"),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;
export type CreateUserBody = z.infer<typeof CreateUserBodySchema>;
