import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hmac } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyIdentityCommand } from '#/modules/auth/commands/verify-identity.command';
import type { VerifyIdentityResponseDto } from '#/modules/auth/interfaces/verify-identity.dto';
import { PortoneIdentityService } from '#/modules/auth/portone-identity.service';

@Injectable()
@CommandHandler(VerifyIdentityCommand)
export class VerifyIdentityHandler implements ICommandHandler<VerifyIdentityCommand, VerifyIdentityResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly portone: PortoneIdentityService) {}

  async execute(command: VerifyIdentityCommand): Promise<VerifyIdentityResponseDto> {
    const user = await this.em.findOne(User, { id: this.principal.ensureUser().id }, { filters: false });
    if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (user.phoneNumberVerified) throw new ApplicationError({ code: 'IDENTITY_ALREADY_VERIFIED', status: HttpStatus.CONFLICT });

    const identity = await this.portone.verify(command.input.identityVerificationId);
    const phoneNumberHash = hmac(identity.phoneNumber, env.PII_HASH_KEY);
    const existing = await this.em.findOne(User, { phoneNumberHash, id: { $ne: user.id } }, { filters: false });
    if (existing) throw new ApplicationError({ code: 'IDENTITY_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });

    user.phoneNumberEncrypted = encrypt(identity.phoneNumber, env.PII_ENCRYPTION_KEY);
    user.phoneNumberHash = phoneNumberHash;
    user.phoneNumberVerified = true;
    user.name = identity.name;
    return { phoneNumberVerified: true };
  }
}
