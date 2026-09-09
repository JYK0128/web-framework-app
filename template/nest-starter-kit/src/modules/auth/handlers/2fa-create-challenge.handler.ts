import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { randomHex } from '@pkg/shared/common';

import { SystemContext } from '#/common/contexts/system.context';
import { VerificationStore } from '#/common/stores/verification.store';
import { TwoFactorChallengeResult, TwoFactorCreateChallengeCommand, type TwoFactorCreateChallengePayload } from '#/modules/auth/commands/2fa-create-challenge.command';

@Injectable()
@CommandHandler(TwoFactorCreateChallengeCommand)
export class Create2FAChallengeHandler implements ICommandHandler<TwoFactorCreateChallengeCommand, TwoFactorChallengeResult> {
  constructor(
    private readonly verificationStore: VerificationStore,
    private readonly systemContext: SystemContext,
  ) {}

  async execute(command: TwoFactorCreateChallengeCommand): Promise<TwoFactorChallengeResult> {
    const input = this.identify(command);
    this.verify(input);
    return this.process(input);
  }

  private identify(command: TwoFactorCreateChallengeCommand): TwoFactorCreateChallengePayload {
    return command.input;
  }

  private verify(input: TwoFactorCreateChallengePayload): void {
    if (!input.userId) {
      throw new Error('2FA 사용자 식별자가 필요합니다.');
    }
  }

  private async process({ userId, rememberMe }: TwoFactorCreateChallengePayload): Promise<TwoFactorChallengeResult> {
    const policy = await this.systemContext.getTwoFactorPolicy();
    const expiresIn = policy.challengeTtlMinutes * 60;
    const challengeId = randomHex();
    const expiresAt = Date.now() + expiresIn * 1000;

    await this.verificationStore.save(
      `2fa:${challengeId}`,
      {
        value: JSON.stringify({ userId, rememberMe: Boolean(rememberMe) }),
        expiresAt,
      },
    );

    return {
      challengeId,
      expiresIn,
    };
  }
}
