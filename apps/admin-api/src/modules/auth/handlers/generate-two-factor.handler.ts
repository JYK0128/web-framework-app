import { randomBytes } from 'node:crypto';

import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { User } from '#/core/database/entities/auth';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { env } from '#/env';
import { GenerateTwoFactorCommand } from '#/modules/auth/commands';
import { GenerateTwoFactorResponseDto } from '#/modules/auth/dto';
import { assertVerificationUnlocked, identifyUser } from '#/modules/auth/handlers/profile-security.helpers';

@Injectable()
@CommandHandler(GenerateTwoFactorCommand)
export class GenerateTwoFactorHandler implements ICommandHandler<GenerateTwoFactorCommand, GenerateTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<GenerateTwoFactorResponseDto> {
    if (!SECURITY_CONFIG.twoFactor.enabled && !SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_DISABLED', status: HttpStatus.FORBIDDEN });
    const user = await identifyUser(this.em, this.principal);
    if (user.twoFactorEnabled) throw new ApplicationError({ code: 'TWO_FACTOR_ALREADY_ENABLED', status: HttpStatus.BAD_REQUEST });
    const secret = toBase32(randomBytes(20));
    const existing = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (existing) {
      assertVerificationUnlocked(existing);
      existing.secret = encrypt(secret, env.TWO_FACTOR_ENCRYPTION_KEY);
      existing.verified = false;
      existing.failedVerificationCount = 0;
      existing.lockedUntil = null;
    }
    else {
      this.em.persist(this.em.create(TwoFactor, { user: this.em.getReference(User, user.id), secret: encrypt(secret, env.TWO_FACTOR_ENCRYPTION_KEY), verified: false }));
    }
    return GenerateTwoFactorResponseDto.parse({ secret, digits: SECURITY_CONFIG.twoFactor.digits, periodSeconds: SECURITY_CONFIG.twoFactor.periodSeconds });
  }
}

function toBase32(value: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const byte of value) bits += byte.toString(2).padStart(8, '0');
  let result = '';
  for (let index = 0; index < bits.length; index += 5) {
    result += alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
  }
  return result;
}
