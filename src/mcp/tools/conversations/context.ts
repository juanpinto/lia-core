import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";

const MessageSchema = z.object({
  id: z.uuid(),
  direction: z.enum(["inbound", "outbound"]),
  role: z.enum(["user", "assistant", "tool", "system"]).nullable(),
  body: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});

const PendingActionSchema = z.object({
  id: z.uuid(),
  actionType: z.string(),
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime({ offset: true }),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
});

const RecentAppointmentSchema = z.object({
  id: z.uuid(),
  status: z.string(),
  startAtUtc: z.iso.datetime({ offset: true }),
  endAtUtc: z.iso.datetime({ offset: true }),
  notes: z.string().nullable(),
});

const InputSchema = z.object({
  companyId: z.uuid(),
  conversationId: z.uuid(),
});

const OutputSchema = z.object({
  context: z.object({
    company: z.object({
      id: z.uuid(),
      name: z.string(),
      timezone: z.string(),
      platformAccountId: z.string(),
    }),
    customer: z.object({
      id: z.uuid(),
      name: z.string().nullable(),
      channel: z.enum(["whatsapp", "instagram", "web", "manual"]),
      platformAccountId: z.string(),
    }),
    conversation: z.object({
      id: z.uuid(),
      startedAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
    }),
    messages: z.array(MessageSchema),
    pendingAction: PendingActionSchema.nullable(),
    recentAppointments: z.array(RecentAppointmentSchema),
  }),
});

export function registerConversationContextTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "conversations.context",
    {
      title: "Get Conversation Context",
      description:
        "Get the initial conversation context, including recent messages, pending action, and upcoming appointments.",
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (args) => {
      try {
        const context = await ctx.conversations.getConversationContext(
          args.companyId,
          args.conversationId,
        );

        return ok({ context });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
