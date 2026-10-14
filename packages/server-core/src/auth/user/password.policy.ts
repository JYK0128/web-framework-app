import { HttpStatus } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { hashPassword, verifyPassword } from '@pkg/shared/server';

export interface PasswordPolicyOptions {
  minLength: number
  maxLength: number
  maxBytes: number
  requireNumbers: boolean
  requireUppercase: boolean
  requireSpecialChar: boolean
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

export function assertPasswordPolicy(password: string, policy: PasswordPolicyOptions): void {
  if (password.length < policy.minLength || password.length > policy.maxLength || Buffer.byteLength(password, 'utf8') > policy.maxBytes) {
    throw new ApplicationError({ code: 'PASSWORD_LENGTH_INVALID', params: { minLength: policy.minLength, maxLength: policy.maxLength, maxBytes: policy.maxBytes }, status: HttpStatus.BAD_REQUEST });
  }
  if (policy.requireNumbers && !/\d/u.test(password)) throw new ApplicationError({ code: 'PASSWORD_NUMBER_REQUIRED', status: HttpStatus.BAD_REQUEST });
  if (policy.requireUppercase && !/[A-Z]/u.test(password)) throw new ApplicationError({ code: 'PASSWORD_UPPERCASE_REQUIRED', status: HttpStatus.BAD_REQUEST });
  if (policy.requireSpecialChar && !/[^\p{L}\p{N}]/u.test(password)) throw new ApplicationError({ code: 'PASSWORD_SPECIAL_CHAR_REQUIRED', status: HttpStatus.BAD_REQUEST });
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
