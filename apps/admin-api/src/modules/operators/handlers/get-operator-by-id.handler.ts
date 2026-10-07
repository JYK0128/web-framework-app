import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetOperatorByIdResponseDto, OperatorItemDto } from '#/modules/operators/interfaces';
import { GetOperatorByIdQuery } from '#/modules/operators/queries';

@Injectable()
@QueryHandler(GetOperatorByIdQuery)
export class GetOperatorByIdHandler implements IQueryHandler<GetOperatorByIdQuery, GetOperatorByIdResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorByIdQuery): Promise<GetOperatorByIdResponseDto> {
    const operator = await this.em.findOne(User, { id: query.input.operatorId }, { populate: ['role'], filters: false });
    if (!operator) {
      throw new ApplicationError({
        code: 'OPERATOR_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
      });
    }

    const accounts = await this.em.find(Account, { user: operator.id }, { filters: false });
    const passwordAccount = accounts.find((account) => account.providerId === Account.PROVIDER_CREDENTIAL);
    const item = OperatorItemDto.from(operator);

    return GetOperatorByIdResponseDto.fromPlain({
      ...item,
      providers: [...new Set(accounts.map((account) => account.providerId))],
      passwordUpdatedAt: passwordAccount?.metadata?.passwordUpdatedAt ?? null,
      lastLoginAt: operator.metadata?.lastLoginAt ? new Date(operator.metadata.lastLoginAt) : null,
    });
  }
}
