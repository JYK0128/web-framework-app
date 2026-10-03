import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { encrypt, hmac } from '@pkg/shared/server';

import { PrincipalContext } from '#/common/contexts/principal.context';
import { Profile } from '#/entities/auth/profile.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { VerifyPhoneNumberCommand } from '#/modules/auth/commands/verify-phone-number.command';
import { VerifyPhoneNumberResponseDto } from '#/modules/auth/interfaces/verify-phone-number.dto';
import { PortoneIdentityService } from '#/modules/auth/portone-identity.service';

@Injectable()
@CommandHandler(VerifyPhoneNumberCommand)
export class VerifyPhoneNumberHandler implements ICommandHandler<VerifyPhoneNumberCommand, VerifyPhoneNumberResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, private readonly portone: PortoneIdentityService) {}

  async execute(command: VerifyPhoneNumberCommand): Promise<VerifyPhoneNumberResponseDto> {
    const user = await this.em.findOne(User, { id: this.principal.ensureUser().id }, { filters: false, populate: ['profile'] });
    if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    const profile = user.profile;
    if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    const identity = await this.portone.verify(command.input.identityVerificationId);
    const phoneNumberHash = hmac(identity.phoneNumber, env.PII_HASH_KEY);
    const existing = await this.em.findOne(Profile, { phoneNumberHash, user: { id: { $ne: user.id } } }, { filters: false });
    if (existing) throw new ApplicationError({ code: 'IDENTITY_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });

    await this.processIdentityProfile(user, profile, identity);
    profile.phoneNumberEncrypted = encrypt(identity.phoneNumber, env.PII_ENCRYPTION_KEY);
    profile.phoneNumberHash = phoneNumberHash;
    user.phoneNumberVerified = true;
    profile.name = identity.name;
    await this.em.flush();
    return VerifyPhoneNumberResponseDto.fromPlain({ phoneNumberVerified: true });
  }

  private async processIdentityProfile(user: User, profile: Profile, identity: Awaited<ReturnType<PortoneIdentityService['verify']>>): Promise<void> {
    const ciHash = identity.ci ? hmac(identity.ci, env.PII_HASH_KEY) : undefined;
    const diHash = identity.di ? hmac(identity.di, env.PII_HASH_KEY) : undefined;
    if (user.phoneNumberVerified && !ciHash && !diHash) {
      throw new ApplicationError({ code: 'IDENTITY_VERIFICATION_DATA_MISSING', status: HttpStatus.BAD_REQUEST, message: '동일인 확인 정보를 제공하지 않는 본인인증 채널입니다.' });
    }
    await this.verifyProfileIdentity(user, profile, ciHash, diHash);

    if (!profile.ciHash && ciHash) profile.ciHash = ciHash;
    if (!profile.diHash && diHash) profile.diHash = diHash;
  }

  private async verifyProfileIdentity(user: User, profile: Profile, ciHash?: string, diHash?: string): Promise<void> {
    if (profile.ciHash || profile.diHash) {
      this.assertSameIdentity(profile, ciHash, diHash);
      return;
    }
    if (ciHash || diHash) await this.assertIdentityIsUnclaimed(user, ciHash, diHash);
  }

  private assertSameIdentity(profile: Profile, ciHash?: string, diHash?: string): void {
    const isSamePerson = Boolean(
      (profile.ciHash && ciHash && profile.ciHash === ciHash)
      || (profile.diHash && diHash && profile.diHash === diHash),
    );
    if (!isSamePerson) throw new ApplicationError({ code: 'IDENTITY_MISMATCH', status: HttpStatus.BAD_REQUEST, message: '본인 명의의 휴대폰 번호로만 변경할 수 있습니다.' });
  }

  private async assertIdentityIsUnclaimed(user: User, ciHash?: string, diHash?: string): Promise<void> {
    const conditions = [
      ...(ciHash ? [{ ciHash }] : []),
      ...(diHash ? [{ diHash }] : []),
    ];
    const existingIdentity = await this.em.findOne(Profile, {
      $or: conditions,
      user: { id: { $ne: user.id } },
    }, { filters: false });
    if (existingIdentity) throw new ApplicationError({ code: 'IDENTITY_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
  }
}
