import { z } from 'zod';

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });

export const CreateChannelAccountBodySchema = z.object({
  channel: z.enum(['whatsapp', 'instagram', 'web', 'manual']),
  externalAccountId: z.string().trim().min(1),
  externalInboxId: z.string().trim().min(1),
  displayName: z.string().trim().min(1).max(200).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateChannelAccountBody = z.infer<typeof CreateChannelAccountBodySchema>;
