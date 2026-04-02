import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import {
  AppointmentItemInputSchema,
  CustomerAppointmentSchema,
} from "./types.js";

const InputSchema = z.object({
  companyId: z.uuid(),
  customerId: z.uuid(),
  conversationId: z.uuid().nullable().optional(),
  startAtLocal: z.string().min(1),
  channel: z
    .enum(["whatsapp", "instagram", "web", "manual"])
    .default("whatsapp"),
  items: z.array(AppointmentItemInputSchema).min(1),
});

export const OutputSchema = CustomerAppointmentSchema;

export function registerCreateAppointmentTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments_create",
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
            customerId: args.customerId,
            conversationId: args.conversationId ?? null,
            startAtLocal: args.startAtLocal,
            createdVia: args.channel,
            items: args.items,
          },
        );

        return ok({
          id: appointment.id,
          startAtUtc: appointment.startAtUtc,
          endAtUtc: appointment.endAtUtc,
          status: appointment.status,
        });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
