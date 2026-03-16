import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import { AppointmentOutputSchema } from "./types.js";

const InputSchema = z.object({
  companyId: z.uuid(),
  appointmentId: z.uuid(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  createdVia: z
    .enum(["whatsapp", "instagram", "web", "manual"])
    .default("manual"),
  notes: z.string().trim().min(1).nullable().optional(),
});

const OutputSchema = AppointmentOutputSchema;

export function registerRescheduleAppointmentTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments_reschedule",
    {
      title: "Reschedule Appointment",
      description: "Reschedule an appointment by updating the existing record.",
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
          },
        );
        return ok({ appointment });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
