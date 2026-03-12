import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/http.js";
import { validateRequest } from "../../lib/validate.js";
import { ingestInboundConversationMessage } from "./service.js";
import {
  AddMessageBodySchema,
  CompanyParamsSchema,
  ConversationParamsSchema,
  CreateConversationBodySchema,
  IngestInboundMessageBodySchema,
} from "./schemas.js";

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.post(
  "/inbound-messages",
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, {
      body: IngestInboundMessageBodySchema,
    });

    const result = await ingestInboundConversationMessage(body);
    ok(res, result, 201);
  }),
);
