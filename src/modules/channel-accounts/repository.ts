import { pool } from "../../db/index.js";
import type { CreateChannelAccountBody } from "./schemas.js";

export interface ChannelAccountRecord {
  id: string;
  companyId: string;
  channel: "whatsapp" | "instagram" | "web" | "manual";
  externalAccountId: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(row: Record<string, unknown>): ChannelAccountRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    channel: row.channel as ChannelAccountRecord["channel"],
    externalAccountId: String(row.platform_account_id),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

export async function insertChannelAccount(
  companyId: string,
  input: CreateChannelAccountBody,
): Promise<ChannelAccountRecord> {
  const result = await pool.query(
    `insert into public.channel_accounts
      (company_id, channel, platform_account_id)
     values ($1, $2, $3)
     returning id, company_id, channel, platform_account_id, created_at, updated_at`,
    [companyId, input.channel, input.externalAccountId],
  );
  return mapRow(result.rows[0]!);
}

export async function listChannelAccounts(
  companyId: string,
): Promise<ChannelAccountRecord[]> {
  const result = await pool.query(
    `select id, company_id, channel, external_account_id, external_inbox_id, display_name, metadata, created_at, updated_at
     from public.channel_accounts
     where company_id = $1
     order by created_at asc`,
    [companyId],
  );
  return result.rows.map(mapRow);
}
