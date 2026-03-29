import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/http.js";
import { validateRequest } from "../../lib/validate.js";
import { NotFoundError } from "../../lib/errors.js";
import {
  listConversationsForCompany,
  getConversation,
  listConversationMessages,
} from "./repository.js";

const CompanyParamsSchema = z.object({ companyId: z.uuid() });
const ConversationParamsSchema = z.object({
  companyId: z.uuid(),
  conversationId: z.uuid(),
});
const ListQuerySchema = z.object({
  status: z.enum(["open", "closed"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { params, query } = validateRequest(req, {
      params: CompanyParamsSchema,
      query: ListQuerySchema,
    });
    const conversations = await listConversationsForCompany(params.companyId, query);
    ok(res, conversations);
  }),
);

conversationsRouter.get(
  "/:conversationId",
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: ConversationParamsSchema });
    const conversation = await getConversation(params.companyId, params.conversationId);
    if (!conversation) throw new NotFoundError(`Conversation ${params.conversationId} not found.`);
    ok(res, conversation);
  }),
);

conversationsRouter.get(
  "/:conversationId/messages",
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: ConversationParamsSchema });
    const messages = await listConversationMessages(params.companyId, params.conversationId);
    ok(res, messages);
  }),
);
