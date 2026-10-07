import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
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
      });
    }

    if (!user.role) {
      throw new ApplicationError({
        code: 'ROLE_NOT_ASSIGNED',
        status: HttpStatus.FORBIDDEN,
      });
    }

    const profile = user.profile;
    if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });

    const accounts = await this.em.find(Account, { user: user.id });
    const credentialAccount = accounts.find((account) => account.providerId === Account.PROVIDER_CREDENTIAL);

    return MeResponseDto.from(
      user,
      profile,
      user.role,
      accounts,
      credentialAccount?.password ? isCredentialPasswordExpired(credentialAccount) : false,
    );
  }
}
