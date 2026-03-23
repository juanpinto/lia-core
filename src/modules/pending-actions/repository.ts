import { pool } from '../../db/index.js';
import { NotFoundError } from '../../lib/errors.js';
import type { z } from 'zod';
import type { ResolvePendingActionBodySchema } from './schemas.js';

export interface CreatePendingActionInput {
  conversationId: string;
  actionType: string;
  payload: Record<string, unknown>;
}

type ResolveInput = z.infer<typeof ResolvePendingActionBodySchema>;

export interface PendingActionRecord {
  id: string;
  companyId: string;
  conversationId: string;
  companyCustomerId: string;
  actionType: string;
  status: 'pending' | 'resolved' | 'expired' | 'cancelled';
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivePendingActionContextRecord {
  id: string;
  actionType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

function mapRow(row: Record<string, unknown>): PendingActionRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    conversationId: String(row.conversation_id),
    companyCustomerId: String(row.company_customer_id),
    actionType: String(row.action_type),
    status: row.status as PendingActionRecord['status'],
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapActiveContextRow(row: Record<string, unknown>): ActivePendingActionContextRecord {
  return {
    id: String(row.id),
    actionType: String(row.action_type),
    payload: (row.payload as Record<string, unknown>) ?? {},
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function insertPendingAction(companyId: string, input: CreatePendingActionInput): Promise<PendingActionRecord> {
  const result = await pool.query(
    `insert into public.pending_actions
      (company_id, conversation_id, company_customer_id, action_type, payload)
     select $1, c.id, c.company_customer_id, $3, $4
     from public.conversations c
     where c.company_id = $1
       and c.id = $2
     returning *`,
    [companyId, input.conversationId, input.actionType, input.payload],
  );

  if (!result.rowCount) {
    throw new NotFoundError(
      `Conversation ${input.conversationId} was not found for company ${companyId}.`,
    );
  }

  return mapRow(result.rows[0]!);
}

export async function savePendingAction(
  companyId: string,
  input: CreatePendingActionInput,
): Promise<PendingActionRecord> {
  const result = await pool.query(
    `insert into public.pending_actions
      (company_id, conversation_id, company_customer_id, action_type, payload)
     select $1, c.id, c.company_customer_id, $3, $4
     from public.conversations c
     where c.company_id = $1
       and c.id = $2
     on conflict (conversation_id)
       where status = 'pending'
     do update
       set action_type = excluded.action_type,
           payload = excluded.payload
     returning *`,
    [
      companyId,
      input.conversationId,
      input.actionType,
      input.payload,
    ],
  );

  if (!result.rowCount) {
    throw new NotFoundError(
      `Conversation ${input.conversationId} was not found for company ${companyId}.`,
    );
  }

  return mapRow(result.rows[0]!);
}

export async function getPendingAction(companyId: string, pendingActionId: string): Promise<PendingActionRecord | null> {
  const result = await pool.query(`select * from public.pending_actions where company_id = $1 and id = $2`, [companyId, pendingActionId]);
  return result.rowCount ? mapRow(result.rows[0]!) : null;
}

export async function listPendingActions(companyId: string): Promise<PendingActionRecord[]> {
  const result = await pool.query(
    `select * from public.pending_actions where company_id = $1 order by created_at desc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}

export async function getActivePendingActionForConversation(
  companyId: string,
  conversationId: string,
): Promise<ActivePendingActionContextRecord | null> {
  const result = await pool.query(
    `select id, action_type, payload, created_at
     from public.pending_actions
     where company_id = $1
       and conversation_id = $2
       and status = 'pending'
     order by created_at desc
     limit 1`,
    [companyId, conversationId],
  );

  return result.rowCount ? mapActiveContextRow(result.rows[0]!) : null;
}

export async function resolvePendingAction(companyId: string, pendingActionId: string, input: ResolveInput): Promise<PendingActionRecord> {
  const result = await pool.query(
    `update public.pending_actions
     set status = $3
     where company_id = $1 and id = $2 and status = 'pending'
     returning *`,
    [companyId, pendingActionId, input.status],
  );
  if (!result.rowCount) {
    throw new NotFoundError(`Pending action ${pendingActionId} was not found or is no longer pending.`);
  }
  return mapRow(result.rows[0]!);
}
