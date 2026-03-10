import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";

const AppointmentItemInputSchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive().default(1),
  unitPriceCents: z.number().int().min(0).nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

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
  conversationId: z.uuid().nullable().optional(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  createdVia: z
    .enum(["whatsapp", "instagram", "web", "manual"])
    .default("whatsapp"),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  items: z.array(AppointmentItemInputSchema).min(1),
});

const OutputSchema = z.object({
  appointment: AppointmentSchema,
});

export function registerCreateAppointmentTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments.create",
    {
      title: "Create Appointment",
      description: "Create an appointment with one or more product line items.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
      },
    },
    async (args) => {
      try {
        const appointment = await ctx.appointments.createAppointment(
          args.companyId,
          {
            companyCustomerId: args.companyCustomerId,
            conversationId: args.conversationId ?? null,
            startAtUtc: args.startAtUtc,
            endAtUtc: args.endAtUtc,
            createdVia: args.createdVia,
            notes: args.notes ?? null,
            metadata: args.metadata ?? null,
            items: args.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents ?? null,
              durationMinutes: item.durationMinutes ?? null,
              sortOrder: item.sortOrder,
              notes: item.notes ?? null,
              metadata: item.metadata ?? null,
            })),
          },
        );

        return ok({ appointment });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
