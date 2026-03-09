import { pool, withTransaction } from '../../db/index.js';
import type { z } from 'zod';
import type { AddMessageBodySchema, CreateConversationBodySchema } from './schemas.js';

type CreateConversationInput = z.infer<typeof CreateConversationBodySchema>;
type AddMessageInput = z.infer<typeof AddMessageBodySchema>;

export interface ConversationRecord {
  id: string;
  companyId: string;
  companyCustomerId: string;
  channelAccountId: string | null;
  channel: string;
  status: 'open' | 'closed';
  metadata: Record<string, unknown> | null;
  summary: string | null;
  summaryUpdatedAt: string | null;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  companyId: string;
  conversationId: string;
  channel: string;
  channelAccountId: string | null;
  externalMessageId: string;
  direction: 'inbound' | 'outbound';
  senderId: string | null;
  body: string | null;
  raw: Record<string, unknown> | null;
  role: 'user' | 'assistant' | 'system' | 'tool' | null;
  createdAt: string;
}

function mapConversationRow(row: Record<string, unknown>): ConversationRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyCustomerId: String(row.company_customer_id),
    channelAccountId: (row.channel_account_id as string | null) ?? null,
    channel: String(row.channel),
    status: row.status as ConversationRecord['status'],
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    summaryUpdatedAt: row.summary_updated_at ? new Date(String(row.summary_updated_at)).toISOString() : null,
    startedAt: new Date(String(row.started_at)).toISOString(),
    endedAt: row.ended_at ? new Date(String(row.ended_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapMessageRow(row: Record<string, unknown>): MessageRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    conversationId: String(row.conversation_id),
    channel: String(row.channel),
    channelAccountId: (row.channel_account_id as string | null) ?? null,
    externalMessageId: String(row.external_message_id),
    direction: row.direction as MessageRecord['direction'],
    senderId: (row.sender_id as string | null) ?? null,
    body: (row.body as string | null) ?? null,
    raw: (row.raw as Record<string, unknown> | null) ?? null,
    role: (row.role as MessageRecord['role']) ?? null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function insertConversation(companyId: string, input: CreateConversationInput): Promise<ConversationRecord> {
  const result = await pool.query(
    `insert into public.conversations
      (company_id, company_customer_id, channel_account_id, channel, metadata, summary, summary_updated_at)
     values ($1, $2, $3, $4, $5, $6, case when $6 is not null then now() else null end)
     returning id, company_id, company_customer_id, channel_account_id, channel, status, metadata, summary, summary_updated_at, started_at, ended_at, created_at, updated_at`,
    [companyId, input.companyCustomerId, input.channelAccountId ?? null, input.channel, input.metadata ?? null, input.summary ?? null],
  );
  return mapConversationRow(result.rows[0]!);
}

export async function getConversation(companyId: string, conversationId: string): Promise<ConversationRecord | null> {
  const result = await pool.query(
    `select id, company_id, company_customer_id, channel_account_id, channel, status, metadata, summary, summary_updated_at, started_at, ended_at, created_at, updated_at
     from public.conversations
     where company_id = $1 and id = $2`,
    [companyId, conversationId],
  );
  return result.rowCount ? mapConversationRow(result.rows[0]!) : null;
}

export async function listMessages(companyId: string, conversationId: string): Promise<MessageRecord[]> {
  const result = await pool.query(
    `select id, company_id, conversation_id, channel, channel_account_id, external_message_id, direction, sender_id, body, raw, role, created_at
     from public.messages
     where company_id = $1 and conversation_id = $2
     order by created_at asc`,
    [companyId, conversationId],
  );
  return result.rows.map(mapMessageRow);
}

export async function insertMessage(companyId: string, conversationId: string, input: AddMessageInput): Promise<MessageRecord> {
  return withTransaction(async (client) => {
    const result = await client.query(
      `insert into public.messages
        (company_id, conversation_id, channel_account_id, channel, external_message_id, direction, sender_id, body, raw, role)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       returning id, company_id, conversation_id, channel, channel_account_id, external_message_id, direction, sender_id, body, raw, role, created_at`,
      [
        companyId,
        conversationId,
        input.channelAccountId ?? null,
        input.channel,
        input.externalMessageId,
        input.direction,
        input.senderId ?? null,
        input.body ?? null,
        input.raw ?? null,
        input.role ?? null,
      ],
    );

    await client.query(`update public.conversations set updated_at = now() where id = $1`, [conversationId]);
    return mapMessageRow(result.rows[0]!);
  });
}
