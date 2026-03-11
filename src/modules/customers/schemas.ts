import { z } from "zod";

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });
export const CustomerParamsSchema = z.object({
  companyId: z.uuid(),
  companyCustomerId: z.uuid(),
});

export const ResolveCompanyCustomerBodySchema = z.object({
  channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
  platformUserId: z.string().trim().min(1),
  customerName: z.string().trim().min(1).max(200).nullable().optional(),
});

export const CreateCompanyCustomerBodySchema = z.object({
  customerName: z.string().trim().min(1).max(200).nullable().optional(),
  channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
  platformUserId: z.string().trim().min(1),
});
