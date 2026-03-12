import { z } from "zod";

export const CompanyParamsSchema = z.object({ companyId: z.uuid() });

export const CreateChannelAccountBodySchema = z.object({
  channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
  externalAccountId: z.string().trim().min(1),
});

export type CreateChannelAccountBody = z.infer<
  typeof CreateChannelAccountBodySchema
>;
