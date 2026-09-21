import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetUserByIdResponseDto, UserItemDto } from '#/modules/users/interfaces';
import { GetUserByIdQuery } from '#/modules/users/queries';

@Injectable()
@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery, GetUserByIdResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetUserByIdQuery): Promise<GetUserByIdResponseDto> {
    const user = await this.em.findOne(User, { id: query.userId }, { populate: ['role'], filters: false });
    if (!user) {
      throw new ApplicationError({
        code: 'USER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '관리자 정보를 찾을 수 없습니다.',
      });
    }

    const accounts = await this.em.find(Account, { user: user.id }, { filters: false });
    const passwordAccount = accounts.find((account) => account.isPasswordAccount);
    const item = UserItemDto.from(user);

    return GetUserByIdResponseDto.fromPlain({
      ...item,
      providers: [...new Set(accounts.map((account) => account.providerId))],
      hasPassword: Boolean(passwordAccount?.password),
      passwordUpdatedAt: passwordAccount?.metadata?.passwordUpdatedAt ?? null,
      lastLoginAt: user.metadata?.lastLoginAt ? new Date(user.metadata.lastLoginAt) : null,
    });
  }
}
