import { Router } from 'express';
import { asyncHandler } from '../../lib/async-handler.js';
import { ok } from '../../lib/http.js';
import { validateRequest } from '../../lib/validate.js';
import {
  addConversationMessage,
  createConversation,
  getConversationMessages,
  getConversationOrThrow,
} from './service.js';
import {
  AddMessageBodySchema,
  CompanyParamsSchema,
  ConversationParamsSchema,
  CreateConversationBodySchema,
} from './schemas.js';

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: CompanyParamsSchema, body: CreateConversationBodySchema });
    const conversation = await createConversation(params.companyId, body);
    ok(res, conversation, 201);
  }),
);

conversationsRouter.get(
  '/:conversationId',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: ConversationParamsSchema });
    const conversation = await getConversationOrThrow(params.companyId, params.conversationId);
    ok(res, conversation);
  }),
);

conversationsRouter.get(
  '/:conversationId/messages',
  asyncHandler(async (req, res) => {
    const { params } = validateRequest(req, { params: ConversationParamsSchema });
    const messages = await getConversationMessages(params.companyId, params.conversationId);
    ok(res, messages);
  }),
);

conversationsRouter.post(
  '/:conversationId/messages',
  asyncHandler(async (req, res) => {
    const { params, body } = validateRequest(req, { params: ConversationParamsSchema, body: AddMessageBodySchema });
    const message = await addConversationMessage(params.companyId, params.conversationId, body);
    ok(res, message, 201);
  }),
);
