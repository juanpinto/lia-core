import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";

const AppointmentItemSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  quantity: z.number().int(),
  unitPriceCents: z.number().int().nullable(),
  durationMinutes: z.number().int().nullable(),
  sortOrder: z.number().int(),
  notes: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

const AppointmentSchema = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  companyCustomerId: z.uuid(),
  conversationId: z.uuid().nullable(),
  rescheduledFromAppointmentId: z.uuid().nullable(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  status: z.enum(["scheduled", "cancelled", "completed", "no_show"]),
  createdVia: z.enum(["whatsapp", "instagram", "web", "manual"]),
  notes: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  cancelledAt: z.iso.datetime({ offset: true }).nullable(),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  items: z.array(AppointmentItemSchema),
});

const InputSchema = z.object({
  companyId: z.uuid(),
  companyCustomerId: z.uuid(),
});

const OutputSchema = z.object({
  appointments: z.array(AppointmentSchema),
});

export function registerListAppointmentsTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments.list",
    {
      title: "List Appointments",
      description: "List appointments for a company customer.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const appointments =
          await ctx.appointments.listCompanyCustomerAppointments(
            args.companyId,
            args.companyCustomerId,
          );
        return ok({ appointments });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
