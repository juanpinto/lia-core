import { z } from 'zod';

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });
export const PendingActionParamsSchema = z.object({ companyId: z.uuid(), pendingActionId: z.uuid() });

export const CreatePendingActionBodySchema = z.object({
  conversationId: z.uuid(),
  companyCustomerId: z.uuid(),
  channel: z.enum(['whatsapp', 'instagram', 'web', 'manual']),
  actionType: z.string().trim().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).default({}),
  expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
});

export const ResolvePendingActionBodySchema = z.object({
  status: z.enum(['resolved', 'expired', 'cancelled']),
});
