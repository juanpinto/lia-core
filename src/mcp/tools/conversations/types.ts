import { z } from "zod";

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
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
});

export const RecentAppointmentSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  notes: z.string().nullable(),
});

export const InputSchema = z.object({
  companyId: z.uuid(),
  conversationId: z.uuid(),
});

export const OutputSchema = z.object({
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

export type ConversationContextToolInput = z.infer<typeof InputSchema>;
export type ConversationContextToolOutput = z.infer<typeof OutputSchema>;
