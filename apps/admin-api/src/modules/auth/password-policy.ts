import { HttpStatus } from '@nestjs/common';
import { ApplicationError, TimeUtil } from '@pkg/shared/common';
import { hash, verify } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account } from '#/entities/auth/account.entity';

export function assertPasswordPolicy(password: string): void {
  const policy = SECURITY_CONFIG.password;
  if (password.length < policy.minLength || password.length > policy.maxLength || Buffer.byteLength(password, 'utf8') > policy.maxBytes) {
    throw new ApplicationError({ code: 'PASSWORD_LENGTH_INVALID', status: HttpStatus.BAD_REQUEST, message: `비밀번호는 ${policy.minLength}~${policy.maxLength}자이며 UTF-8 기준 ${policy.maxBytes}바이트 이하여야 합니다.` });
  }
  if (policy.requireNumbers && !/\d/u.test(password)) {
    throw new ApplicationError({ code: 'PASSWORD_NUMBER_REQUIRED', status: HttpStatus.BAD_REQUEST, message: '비밀번호에 숫자를 포함해야 합니다.' });
  }
  if (policy.requireUppercase && !/[A-Z]/u.test(password)) {
    throw new ApplicationError({ code: 'PASSWORD_UPPERCASE_REQUIRED', status: HttpStatus.BAD_REQUEST, message: '비밀번호에 영문 대문자를 포함해야 합니다.' });
  }
  if (policy.requireSpecialChar && !/[^\p{L}\p{N}]/u.test(password)) {
    throw new ApplicationError({ code: 'PASSWORD_SPECIAL_CHAR_REQUIRED', status: HttpStatus.BAD_REQUEST, message: '비밀번호에 특수문자를 포함해야 합니다.' });
  }
}

export async function updateCredentialPassword(account: Account, password: string): Promise<void> {
  await assertPasswordCanBeUsed(account, password);
  const priorHistory = account.metadata?.passwordHistory ?? [];
  const history = account.password
    ? [account.password, ...priorHistory].slice(0, SECURITY_CONFIG.password.historyLimit)
    : priorHistory.slice(0, SECURITY_CONFIG.password.historyLimit);
  account.password = await hash(password);
  account.updateMetadata({ passwordUpdatedAt: new Date(), passwordHistory: history });
}

export async function assertPasswordCanBeUsed(account: Account, password: string): Promise<void> {
  assertPasswordPolicy(password);
  const priorHistory = account.metadata?.passwordHistory ?? [];
  const historyLimit = Math.max(0, SECURITY_CONFIG.password.historyLimit);
  // The current password is checked in addition to the configured prior-password history.
  const previousHashes = [account.password, ...priorHistory]
    .filter((value): value is string => typeof value === 'string')
    .slice(0, 1 + historyLimit);
  for (const previousHash of previousHashes) {
    if (await verify(password, previousHash)) {
      throw new ApplicationError({ code: 'PASSWORD_REUSED', status: HttpStatus.BAD_REQUEST, message: '최근 사용한 비밀번호는 다시 사용할 수 없습니다.' });
    }
  }
}

export function isCredentialPasswordExpired(account: Account, now = Date.now()): boolean {
  const { expirationDays, changeDeferDays } = SECURITY_CONFIG.password;
  if (expirationDays <= 0) return false;
  const passwordUpdatedAt = account.metadata?.passwordUpdatedAt ?? account.createdAt;
  const expiresAt = passwordUpdatedAt.getTime() + TimeUtil.ms.day(expirationDays + Math.max(0, changeDeferDays));
  return now >= expiresAt;
}
