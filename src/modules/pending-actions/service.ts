import { NotFoundError } from '../../lib/errors.js';
import { getConversation } from '../conversations/repository.js';
import { getPendingAction, insertPendingAction, listPendingActions, resolvePendingAction } from './repository.js';
import type { z } from 'zod';
import type { CreatePendingActionBodySchema, ResolvePendingActionBodySchema } from './schemas.js';

type CreateInput = z.infer<typeof CreatePendingActionBodySchema>;
type ResolveInput = z.infer<typeof ResolvePendingActionBodySchema>;

export async function createPendingActionService(companyId: string, input: CreateInput) {
  const conversation = await getConversation(companyId, input.conversationId);
  if (!conversation) {
    throw new NotFoundError(`Conversation ${input.conversationId} was not found for company ${companyId}.`);
  }

  return insertPendingAction(companyId, {
    conversationId: input.conversationId,
    companyCustomerId: conversation.companyCustomerId,
    actionType: input.actionType,
    payload: input.payload,
  });
}

export async function listPendingActionsService(companyId: string) {
  return listPendingActions(companyId);
}

export async function getPendingActionOrThrow(companyId: string, pendingActionId: string) {
  const action = await getPendingAction(companyId, pendingActionId);
  if (!action) {
    throw new NotFoundError(`Pending action ${pendingActionId} was not found for company ${companyId}.`);
  }
  return action;
}

export async function resolvePendingActionService(companyId: string, pendingActionId: string, input: ResolveInput) {
  return resolvePendingAction(companyId, pendingActionId, input);
}
