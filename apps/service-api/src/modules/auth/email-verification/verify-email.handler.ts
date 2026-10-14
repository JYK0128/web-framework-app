import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';

import { AppEntityManager } from '#/core/database/entity-manager';
import { verifyEmailChallenge } from '#/modules/auth/email-verification/email-verification.helper';
import { VerifyEmailCommand } from '#/modules/auth/email-verification/verify-email.command';
import { VerifyEmailResponseDto } from '#/modules/auth/email-verification/verify-email.response.dto';

@Injectable()
@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand, VerifyEmailResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly kv: KvStore) {}
  async execute(command: VerifyEmailCommand): Promise<VerifyEmailResponseDto> {
    await verifyEmailChallenge(this.em, this.kv, command.input.challengeId, command.input.token);
    return VerifyEmailResponseDto.parse({ ok: true });
  }
}
