import { z } from "zod";
import {
  ProcessInboundMessageBodySchema,
  ProcessOutboundMessageBodySchema,
} from "../../../modules/conversations/schemas.js";

export const MessageSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["inbound", "outbound"]),
  role: z.enum(["user", "assistant", "tool", "system"]).nullable(),
  body: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});

export const ProcessInboundMessageInputSchema = ProcessInboundMessageBodySchema;

export const ConversationContextOutputSchema = z.object({
  context: z.object({
    company: z.object({
      id: z.uuid(),
      name: z.string(),
      timezone: z.string(),
      platformAccountId: z.string(),
    }),
    customer: z.object({
      id: z.uuid(),
      name: z.string().nullable(),
      channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
      platformAccountId: z.string(),
    }),
    conversation: z.object({
      id: z.uuid(),
      startedAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
    }),
    conversationHistory: z.array(MessageSchema),
  }),
});

export const ProcessOutboundMessageInputSchema =
  ProcessOutboundMessageBodySchema;

export const ProcessOutboundMessageResultSchema = z.object({
  customerId: z.uuid(),
  companyId: z.uuid(),
  companyName: z.string(),
  conversationId: z.uuid(),
  messageId: z.uuid(),
});

export const ProcessOutboundMessageOutputSchema = z.object({
  result: ProcessOutboundMessageResultSchema,
});
