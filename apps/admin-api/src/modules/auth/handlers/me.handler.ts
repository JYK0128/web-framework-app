import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { MeResponseDto } from '#/modules/auth/interfaces/me.response.dto';
import { isCredentialPasswordExpired } from '#/modules/auth/password-policy';
import { MeQuery } from '#/modules/auth/queries/me.query';

@Injectable()
@QueryHandler(MeQuery)
export class MeHandler implements IQueryHandler<MeQuery, MeResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: MeQuery): Promise<MeResponseDto> {
    const { input } = query;
    const user = await this.em.findOne(
      User,
      { id: input.userId, deletedAt: null },
      { populate: ['role', 'profile'] },
    );

    if (!user || user.isBanned || user.isLocked) {
      throw new ApplicationError({
        code: 'USER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '사용자 정보를 찾을 수 없습니다.',
      });
    }

    if (!user.role) {
      throw new ApplicationError({
        code: 'ROLE_NOT_ASSIGNED',
        status: HttpStatus.FORBIDDEN,
        message: '사용자에게 역할이 할당되어 있지 않습니다.',
      });
    }

    const profile = user.profile;
    if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });

    const credentialAccount = await this.em.findOne(Account, {
      user: user.id,
      providerId: Account.PROVIDER_CREDENTIAL,
    });

    return MeResponseDto.fromPlain<MeResponseDto>({
      id: user.id,
      email: decrypt(profile.emailEncrypted, env.PII_ENCRYPTION_KEY),
      name: profile.name,
      image: profile.image,
      emailVerified: Boolean(user.emailVerified),
      phoneNumber: profile.phoneNumberEncrypted ? decrypt(profile.phoneNumberEncrypted, env.PII_ENCRYPTION_KEY) : null,
      phoneNumberVerified: Boolean(user.phoneNumberVerified),
      twoFactorEnabled: user.twoFactorEnabled,
      hasPassword: Boolean(credentialAccount?.password),
      passwordUpdatedAt: credentialAccount?.metadata?.passwordUpdatedAt ?? null,
      passwordExpired: credentialAccount?.password ? isCredentialPasswordExpired(credentialAccount) : false,
      roleCode: user.role.code,
      roleLabel: user.role.label ?? '',
      permissions: user.role.permissions ?? [],
      lastLoginAt: user.metadata?.lastLoginAt ? new Date(user.metadata.lastLoginAt).toISOString() : null,
    });
  }
}
