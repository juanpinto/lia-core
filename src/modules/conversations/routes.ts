import { Router } from "express";
import { requireHttpService } from "../../auth/http.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { ok } from "../../lib/http.js";
import { validateRequest } from "../../lib/validate.js";
import {
  ingestInboundConversationMessage,
  ingestOutboundConversationMessage,
} from "./service.js";
import {
  IngestInboundMessageBodySchema,
  UpdateConversationBodySchema,
} from "./schemas.js";

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.post(
  "/inbound-messages",
  requireHttpService("gateway"),
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, {
      body: IngestInboundMessageBodySchema,
    });

    const result = await ingestInboundConversationMessage(body);
    ok(res, result, 201);
  }),
);

conversationsRouter.post(
  "/outbound-messages",
  requireHttpService("gateway"),
  asyncHandler(async (req, res) => {
    const { body } = validateRequest(req, {
      body: UpdateConversationBodySchema,
    });

    const result = await ingestOutboundConversationMessage(body);
    ok(res, result);
  }),
);

conversationsRouter.use(requireHttpService("internal"));
