import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetOperatorsResponseDto, OperatorItemDto, OperatorStatus } from '#/modules/operators/interfaces';
import { GetOperatorsQuery } from '#/modules/operators/queries';

@Injectable()
@QueryHandler(GetOperatorsQuery)
export class GetOperatorsHandler implements IQueryHandler<GetOperatorsQuery, GetOperatorsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorsQuery): Promise<GetOperatorsResponseDto> {
    const result = await this.em.findByPage(User, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['role'],
      filters: query.input.includeDeleted || query.input.status === OperatorStatus.DELETED ? false : undefined,
    });

    return GetOperatorsResponseDto.fromPlain({
      ...result,
      items: result.items.map((operator) => OperatorItemDto.from(operator)),
    });
  }
}
