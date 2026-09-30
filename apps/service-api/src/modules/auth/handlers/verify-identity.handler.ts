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
    const verified = await this.portone.verify(command.input.identityVerificationId);
    const phoneHash = hmac(verified.phoneNumber, env.PII_HASH_KEY);
    const existing = await this.em.findOne(Profile, { phoneNumberHash: phoneHash }, { populate: ['user'] });
    if (existing && existing.user.id !== user.id) {
      throw new ApplicationError({ code: 'IDENTITY_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }

    const profile = await this.processIdentityProfile(user, verified);
    profile.phoneNumberEncrypted = encrypt(verified.phoneNumber, env.PII_ENCRYPTION_KEY);
    profile.phoneNumberHash = phoneHash;
    user.phoneNumberVerified = true;
    user.name = verified.name;
    if (!user.profile) this.em.persist(profile);
    await this.em.flush();
    return { phoneNumberVerified: true };
  }

  private async processIdentityProfile(user: User, identity: Awaited<ReturnType<PortoneIdentityService['verify']>>): Promise<Profile> {
    const identityCiHash = identity.ci ? hmac(identity.ci, env.PII_HASH_KEY) : undefined;
    const identityDiHash = identity.di ? hmac(identity.di, env.PII_HASH_KEY) : undefined;
    if (user.phoneNumberVerified && !identityCiHash && !identityDiHash) {
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_DATA_MISSING', status: HttpStatus.BAD_REQUEST, message: '동일인 확인 정보를 제공하지 않는 본인인증 채널입니다.' });
    }
    const profile = user.profile ?? this.em.create(Profile, { user: this.em.getReference(User, user.id) });
    await this.verifyProfileIdentity(user, profile, identityCiHash, identityDiHash);

    if (!profile.identityCiHash && identityCiHash) profile.identityCiHash = identityCiHash;
    if (!profile.identityDiHash && identityDiHash) profile.identityDiHash = identityDiHash;
    return profile;
  }

  private async verifyProfileIdentity(user: User, profile: Profile, identityCiHash?: string, identityDiHash?: string): Promise<void> {
    if (profile.identityCiHash || profile.identityDiHash) {
      this.assertSameIdentity(profile, identityCiHash, identityDiHash);
      return;
    }
    if (identityCiHash || identityDiHash) await this.assertIdentityIsUnclaimed(user, identityCiHash, identityDiHash);
  }

  private assertSameIdentity(profile: Profile, identityCiHash?: string, identityDiHash?: string): void {
    const isSamePerson = Boolean(
      (profile.identityCiHash && identityCiHash && profile.identityCiHash === identityCiHash)
      || (profile.identityDiHash && identityDiHash && profile.identityDiHash === identityDiHash),
    );
    if (!isSamePerson) throw new ApplicationError({ code: 'IDENTITY_MISMATCH', status: HttpStatus.BAD_REQUEST, message: '본인 명의의 휴대폰 번호로만 변경할 수 있습니다.' });
  }

  private async assertIdentityIsUnclaimed(user: User, identityCiHash?: string, identityDiHash?: string): Promise<void> {
    const conditions = [
      ...(identityCiHash ? [{ identityCiHash }] : []),
      ...(identityDiHash ? [{ identityDiHash }] : []),
    ];
    const existingIdentity = await this.em.findOne(Profile, {
      $or: conditions,
      user: { id: { $ne: user.id } },
    }, { filters: false });
    if (existingIdentity) throw new ApplicationError({ code: 'IDENTITY_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
  }
}
