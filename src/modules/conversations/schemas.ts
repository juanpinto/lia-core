import { z } from "zod";

export const CoreChannelSchema = z.enum([
  "whatsapp",
  "instagram",
  "web",
  "manual",
]);

export const ProcessInboundMessageBodySchema = z.object({
  customerName: z.string().trim().min(1).nullable().optional(),
  channel: CoreChannelSchema,
  companyPlatformId: z.string().trim().min(1),
  externalMessageId: z.string().trim().min(1),
  customerPlatformId: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export const ProcessOutboundMessageBodySchema = z.object({
  channel: CoreChannelSchema,
  companyId: z.string().trim().min(1),
  externalMessageId: z.string().trim().min(1),
  customerId: z.string().trim().min(1),
  body: z.string().trim().min(1),
  summary_patch: z.string(),
});
