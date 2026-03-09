import { NotFoundError } from '../../lib/errors.js';
import { getConversation, insertConversation, insertMessage, listMessages } from './repository.js';
import type { z } from 'zod';
import type { AddMessageBodySchema, CreateConversationBodySchema } from './schemas.js';

type CreateConversationInput = z.infer<typeof CreateConversationBodySchema>;
type AddMessageInput = z.infer<typeof AddMessageBodySchema>;

export async function createConversation(companyId: string, input: CreateConversationInput) {
  return insertConversation(companyId, input);
}

export async function getConversationOrThrow(companyId: string, conversationId: string) {
  const conversation = await getConversation(companyId, conversationId);
  if (!conversation) {
    throw new NotFoundError(`Conversation ${conversationId} was not found for company ${companyId}.`);
  }
  return conversation;
}

export async function getConversationMessages(companyId: string, conversationId: string) {
  await getConversationOrThrow(companyId, conversationId);
  return listMessages(companyId, conversationId);
}

export async function addConversationMessage(companyId: string, conversationId: string, input: AddMessageInput) {
  await getConversationOrThrow(companyId, conversationId);
  return insertMessage(companyId, conversationId, input);
}
