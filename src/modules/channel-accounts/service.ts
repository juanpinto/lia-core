import { insertChannelAccount, listChannelAccounts } from './repository.js';
import type { CreateChannelAccountBody } from './schemas.js';

export async function createChannelAccount(companyId: string, input: CreateChannelAccountBody) {
  return insertChannelAccount(companyId, input);
}

export async function getChannelAccounts(companyId: string) {
  return listChannelAccounts(companyId);
}
