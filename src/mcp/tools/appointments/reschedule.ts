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
  appointmentId: z.uuid(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  createdVia: z
    .enum(["whatsapp", "instagram", "web", "manual"])
    .default("manual"),
  notes: z.string().trim().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

const OutputSchema = z.object({
  appointment: AppointmentSchema,
});

export function registerRescheduleAppointmentTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments.reschedule",
    {
      title: "Reschedule Appointment",
      description:
        "Reschedule an appointment by creating a replacement appointment linked to the original.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
      },
    },
    async (args) => {
      try {
        const appointment = await ctx.appointments.rescheduleAppointment(
          args.companyId,
          args.appointmentId,
          {
            startAtUtc: args.startAtUtc,
            endAtUtc: args.endAtUtc,
            createdVia: args.createdVia,
            notes: args.notes ?? null,
            metadata: args.metadata ?? null,
          },
        );
        return ok({ appointment });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
