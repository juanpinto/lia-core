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

export const PendingActionSchema = z.object({
  id: z.uuid(),
  actionType: z.string(),
  payload: z.record(z.string(), z.unknown()),
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
    pendingAction: PendingActionSchema.nullable(),
  }),
});

export const ProcessOutboundMessageInputSchema =
  ProcessOutboundMessageBodySchema;

export const SavePendingActionInputSchema = z.object({
  companyId: z.uuid(),
  conversationId: z.uuid(),
  actionType: z.string().trim().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const SavePendingActionResultSchema = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  actionType: z.string(),
  status: z.enum(["pending", "resolved", "expired", "cancelled"]),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const SavePendingActionOutputSchema = SavePendingActionResultSchema;

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
