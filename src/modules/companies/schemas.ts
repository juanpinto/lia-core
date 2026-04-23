import { z } from 'zod';

export const CompanyIdParamsSchema = z.object({
  companyId: z.uuid(),
});

export const CreateCompanyBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  timezone: z.string().trim().min(1).max(100).default('America/New_York'),
  description: z.string().trim().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  address: z.string().trim().nullable().optional(),
  hoursOfOperation: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateCompanyBody = z.infer<typeof CreateCompanyBodySchema>;
