import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import { AppointmentOutputSchema } from "./types.js";

const InputSchema = z.object({
  companyId: z.uuid(),
  appointmentId: z.uuid(),
  reason: z.string().trim().min(1).nullable().optional(),
});

const OutputSchema = AppointmentOutputSchema;

export function registerCancelAppointmentTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments.cancel",
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
          {
            reason: args.reason ?? null,
          },
        );
        return ok({ appointment });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
