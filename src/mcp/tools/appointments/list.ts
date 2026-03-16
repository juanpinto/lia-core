import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import { CustomerAppointmentsOutputSchema } from "./types.js";

const InputSchema = z.object({
  customerId: z.uuid(),
});

const OutputSchema = CustomerAppointmentsOutputSchema;

export function registerListAppointmentsTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "appointments_list",
    {
      title: "List Appointments",
      description: "List appointments for a customer.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const appointments = await ctx.appointments.listAppointmentsForCustomer(
          args.customerId,
        );
        return ok({ appointments });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
