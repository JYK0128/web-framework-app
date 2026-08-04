import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

export const CREDENTIAL_PROVIDER = 'credential';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createCredentialAccount(user: User, password: string): Account {
  const account = new Account();
  account.user = user;
  account.accountId = user.id;
  account.providerId = CREDENTIAL_PROVIDER;
  account.password = password;
  return account;
}
