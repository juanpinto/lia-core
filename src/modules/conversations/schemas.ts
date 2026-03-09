import { z } from 'zod';

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });
export const ConversationParamsSchema = z.object({ companyId: z.uuid(), conversationId: z.uuid() });

export const CreateConversationBodySchema = z.object({
  companyCustomerId: z.uuid(),
  channel: z.enum(['whatsapp', 'instagram', 'web', 'manual']),
  channelAccountId: z.uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  summary: z.string().trim().min(1).nullable().optional(),
});

export const AddMessageBodySchema = z.object({
  channel: z.enum(['whatsapp', 'instagram', 'web', 'manual']),
  channelAccountId: z.uuid().nullable().optional(),
  externalMessageId: z.string().trim().min(1),
  direction: z.enum(['inbound', 'outbound']),
  senderId: z.string().trim().min(1).nullable().optional(),
  body: z.string().trim().min(1).nullable().optional(),
  raw: z.record(z.string(), z.unknown()).nullable().optional(),
  role: z.enum(['user', 'assistant', 'system', 'tool']).nullable().optional(),
});
