import { z } from 'zod';

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });
export const ProductSearchQuerySchema = z.object({ q: z.string().trim().min(1) });

export const CreateProductBodySchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2_000).nullable().optional(),
  active: z.boolean().default(true),
  price: z.number().int().min(0).nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
});

export type CreateProductBody = z.infer<typeof CreateProductBodySchema>;
