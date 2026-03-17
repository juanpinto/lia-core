import { z } from "zod";

export const CoreChannelSchema = z.enum([
  "whatsapp",
  "instagram",
  "web",
  "manual",
]);

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });
export const ConversationParamsSchema = z.object({
  companyId: z.uuid(),
  conversationId: z.uuid(),
});

export const CreateConversationBodySchema = z.object({
  companyCustomerId: z.uuid(),
  channel: CoreChannelSchema,
  channelAccountId: z.uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  summary: z.string().trim().min(1).nullable().optional(),
});

export const AddMessageBodySchema = z.object({
  channel: CoreChannelSchema,
  channelAccountId: z.uuid().nullable().optional(),
  externalMessageId: z.string().trim().min(1),
  direction: z.enum(["inbound", "outbound"]),
  senderId: z.string().trim().min(1).nullable().optional(),
  body: z.string().trim().min(1).nullable().optional(),
  raw: z.record(z.string(), z.unknown()).nullable().optional(),
  role: z.enum(["user", "assistant", "system", "tool"]).nullable().optional(),
});

export const IngestInboundMessageBodySchema = z.object({
  customerName: z.string().trim().min(1).nullable().optional(),
  channel: CoreChannelSchema,
  companyPlatformId: z.string().trim().min(1),
  externalMessageId: z.string().trim().min(1),
  customerPlatformId: z.string().trim().min(1),
  body: z.string().trim().min(1),
});

export const UpdateConversationBodySchema = z.object({
  channel: CoreChannelSchema,
  companyPlatformId: z.string().trim().min(1),
  externalMessageId: z.string().trim().min(1),
  customerPlatformId: z.string().trim().min(1),
  body: z.string().trim().min(1),
  summary_patch: z.string(),
});
