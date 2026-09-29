import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hmac } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyIdentityCommand } from '#/modules/auth/commands/verify-identity.command';
import type { VerifyIdentityResponseDto } from '#/modules/auth/dto/verify-identity.dto';
import { PortoneIdentityService } from '#/modules/auth/portone-identity.service';

@Injectable()
@CommandHandler(VerifyIdentityCommand)
export class VerifyIdentityHandler implements ICommandHandler<VerifyIdentityCommand, VerifyIdentityResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly principal: PrincipalContext,
    private readonly portone: PortoneIdentityService,
  ) {}

  async execute(command: VerifyIdentityCommand): Promise<VerifyIdentityResponseDto> {
    const user = await this.em.findOne(User, { id: this.principal.ensureUser().id }, { populate: ['profile'] });
    if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    if (user.phoneNumberVerified) throw new ApplicationError({ code: 'IDENTITY_ALREADY_VERIFIED', status: HttpStatus.CONFLICT });

    const verified = await this.portone.verify(command.input.identityVerificationId);
    const phoneHash = hmac(verified.phoneNumber, env.PII_HASH_KEY);
    const existing = await this.em.findOne(Profile, { phoneNumberHash: phoneHash }, { populate: ['user'] });
    if (existing && existing.user.id !== user.id) {
      throw new ApplicationError({ code: 'IDENTITY_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }

    const profile = user.profile ?? this.em.create(Profile, { user: this.em.getReference(User, user.id) });
    profile.phoneNumberEncrypted = encrypt(verified.phoneNumber, env.PII_ENCRYPTION_KEY);
    profile.phoneNumberHash = phoneHash;
    user.phoneNumberVerified = true;
    user.name = verified.name;
    if (!user.profile) this.em.persist(profile);
    await this.em.flush();
    return { phoneNumberVerified: true };
  }
}
