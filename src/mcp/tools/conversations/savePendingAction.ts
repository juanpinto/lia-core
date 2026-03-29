import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { McpContext } from "../../context.js";
import { ok } from "../../result.js";
import { toMcpErrorResult } from "../../errorMapper.js";
import {
  SavePendingActionInputSchema,
  SavePendingActionOutputSchema,
} from "./types.js";

export function registerSavePendingActionTool(
  server: McpServer,
  ctx: McpContext,
): void {
  server.registerTool(
    "save_pending_action",
    {
      title: "Save Pending Action",
      description:
        "Create a pending action for a conversation, or update the existing active pending action for that conversation.",
      inputSchema: SavePendingActionInputSchema,
      outputSchema: SavePendingActionOutputSchema,
      annotations: {
        readOnlyHint: false,
        idempotentHint: false,
      },
    },
    async (args) => {
      try {
        const pendingAction = await ctx.conversations.savePendingAction(
          args.companyId,
          {
            conversationId: args.conversationId,
            actionType: args.actionType,
            payload: args.payload,
          },
        );

        return ok({
          id: pendingAction.id,
          conversationId: pendingAction.conversationId,
          actionType: pendingAction.actionType,
          status: pendingAction.status,
          payload: pendingAction.payload,
          createdAt: pendingAction.createdAt,
          updatedAt: pendingAction.updatedAt,
        });
      } catch (error) {
        return toMcpErrorResult(error);
      }
    },
  );
}
