import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import { CustomerAppointmentSchema } from "./types.js";

const InputSchema = z.object({
  companyId: z.uuid(),
  appointmentId: z.uuid(),
});

const OutputSchema = CustomerAppointmentSchema;

export function registerCancelAppointmentTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments_cancel",
    {
      title: "Cancel Appointment",
      description: "Cancel an existing scheduled appointment.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
        destructiveHint: true,
      },
    },
    async (args) => {
      try {
        const appointment = await ctx.appointments.cancelAppointment(
          args.companyId,
          args.appointmentId,
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
