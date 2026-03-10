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
  displayName: z.string().trim().min(1).max(200).nullable().optional(),
  customerMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
  companyCustomerMetadata: z
    .record(z.string(), z.unknown())
    .nullable()
    .optional(),
});

const OutputSchema = z.object({
  companyCustomer: z.object({
    id: z.uuid(),
    companyId: z.uuid(),
    customerId: z.uuid(),
    displayName: z.string().nullable(),
    notes: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    firstSeenAt: z.iso.datetime({ offset: true }),
    lastSeenAt: z.iso.datetime({ offset: true }),
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
            displayName: args.displayName ?? null,
            customerMetadata: args.customerMetadata ?? null,
            companyCustomerMetadata: args.companyCustomerMetadata ?? null,
          },
        );

        return ok({ companyCustomer });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
