import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";

const InputSchema = z.object({
  companyId: z.uuid(),
  channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
  platformUserId: z.string().trim().min(1),
  customerName: z.string().trim().min(1).max(200).nullable().optional(),
});

const OutputSchema = z.object({
  companyCustomer: z.object({
    companyCustomerId: z.uuid(),
    id: z.uuid().optional(),
    companyId: z.uuid(),
    customerId: z.uuid(),
    customerName: z.string().nullable(),
    channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
    platformUserId: z.string().trim().min(1),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  }),
});

export function registerResolveCustomerTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "customers.resolve",
    {
      title: "Resolve Customer",
      description:
        "Resolve or create a global customer, customer identity, and company_customer link for a tenant.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        idempotentHint: true,
        readOnlyHint: false,
      },
    },
    async (args) => {
      try {
        const companyCustomer = await ctx.customers.resolveCompanyCustomer(
          args.companyId,
          {
            channel: args.channel,
            platformUserId: args.platformUserId,
            customerName: args.customerName ?? null,
          },
        );

        return ok({
          companyCustomer: {
            ...companyCustomer,
            id: companyCustomer.companyCustomerId,
          },
        });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
