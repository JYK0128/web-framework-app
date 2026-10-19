import { HttpStatus } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { assertPasswordPolicy, type AuthPolicyConfig } from '@pkg/shared/policy';
import { hashPassword, verifyPassword } from '@pkg/shared/server';

export interface PasswordPolicyOptions extends Pick<AuthPolicyConfig,
  | 'passwordMinLength'
  | 'passwordMaxLength'
  | 'passwordMaxBytes'
  | 'passwordRequiresNumbers'
  | 'passwordRequiresUppercase'
  | 'passwordRequiresSpecialChar'> {
  historyLimit: number
  expirationDays: number
  changeDeferDays: number
}

export interface CredentialAccount {
  createdAt: Date
  password: string | null
  metadata: { passwordUpdatedAt?: Date | null, passwordHistory?: string[] } | null
  updateMetadata(patch: { passwordUpdatedAt: Date, passwordHistory: string[] }): void
}

export async function updateCredentialPassword(account: CredentialAccount, password: string, policy: PasswordPolicyOptions): Promise<void> {
  await assertPasswordCanBeUsed(account, password, policy);
  const priorHistory = account.metadata?.passwordHistory ?? [];
  const history = account.password ? [account.password, ...priorHistory].slice(0, policy.historyLimit) : priorHistory.slice(0, policy.historyLimit);
  account.password = await hashPassword(password);
  account.updateMetadata({ passwordUpdatedAt: new Date(), passwordHistory: history });
}

export async function assertPasswordCanBeUsed(account: CredentialAccount, password: string, policy: PasswordPolicyOptions): Promise<void> {
  assertPasswordPolicy(password, policy);
  const previousHashes = [account.password, ...(account.metadata?.passwordHistory ?? [])]
    .filter((value): value is string => typeof value === 'string')
    .slice(0, 1 + Math.max(0, policy.historyLimit));
  for (const previousHash of previousHashes) {
    if (await verifyPassword(password, previousHash)) throw new ApplicationError({ code: 'PASSWORD_REUSED', status: HttpStatus.BAD_REQUEST });
  }
}

export function isCredentialPasswordExpired(account: Pick<CredentialAccount, 'createdAt' | 'password' | 'metadata'>, policy: Pick<PasswordPolicyOptions, 'expirationDays' | 'changeDeferDays'>, now = Date.now()): boolean {
  const expiresAt = getCredentialPasswordExpiresAt(account, policy);
  return expiresAt !== null && now >= expiresAt;
}

export function getCredentialPasswordExpiresAt(account: Pick<CredentialAccount, 'createdAt' | 'password' | 'metadata'>, policy: Pick<PasswordPolicyOptions, 'expirationDays' | 'changeDeferDays'>): number | null {
  if (policy.expirationDays <= 0 || !account.password) return null;
  const passwordUpdatedAt = account.metadata?.passwordUpdatedAt ?? account.createdAt;
  return passwordUpdatedAt.getTime() + TimeUtil.ms.day(policy.expirationDays + Math.max(0, policy.changeDeferDays));
}
