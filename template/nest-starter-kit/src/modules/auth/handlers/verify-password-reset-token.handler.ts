import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { jsonSafeParse, maskEmail } from '@pkg/shared/common';

import { VerificationStore } from '#/common/stores/verification.store';
import type { VerifyPasswordResetTokenResponseDto } from '#/modules/auth/dto/verify-password-reset-token.response.dto';
import type { PasswordResetChallengePayload } from '#/modules/auth/handlers/issue-password-reset-challenge.handler';
import { VerifyPasswordResetTokenQuery } from '#/modules/auth/queries/verify-password-reset-token.query';

@Injectable()
@QueryHandler(VerifyPasswordResetTokenQuery)
export class VerifyPasswordResetTokenHandler implements IQueryHandler<VerifyPasswordResetTokenQuery, VerifyPasswordResetTokenResponseDto> {
  constructor(private readonly verificationStore: VerificationStore) {}

  async execute(query: VerifyPasswordResetTokenQuery): Promise<VerifyPasswordResetTokenResponseDto> {
    const identified = await this.identify(query);
    const payload = this.verify(identified);
    return this.process(payload);
  }

  private async identify(query: VerifyPasswordResetTokenQuery) {
    const { challengeId, token } = query.input;
    const record = await this.verificationStore.get(`password-reset:${challengeId}`);
    return { record, token };
  }

  private verify(
    identified: Awaited<ReturnType<VerifyPasswordResetTokenHandler['identify']>>,
  ): PasswordResetChallengePayload | null {
    const { record, token } = identified;
    if (!record || record.expiresAt <= Date.now()) return null;

    const payload = jsonSafeParse<PasswordResetChallengePayload>(record.value);
    if (!payload || payload.token !== token) return null;
    return payload;
  }

  private process(payload: PasswordResetChallengePayload | null): VerifyPasswordResetTokenResponseDto {
    if (!payload) return { isValid: false };
    return {
      isValid: true,
      maskedEmail: maskEmail(payload.email),
    };
  }
}
