import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { OperatorItemDto, OperatorPageResponseDto, OperatorStatus } from '#/modules/operators';
import { GetOperatorsQuery } from '#/modules/operators/get-operators.query';

@Injectable()
@QueryHandler(GetOperatorsQuery)
export class GetOperatorsHandler implements IQueryHandler<GetOperatorsQuery, OperatorPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorsQuery): Promise<OperatorPageResponseDto> {
    const result = await this.em.findByPage(User, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['role', 'profile'],
      filters: query.input.includeDeleted || query.input.status === OperatorStatus.DELETED ? false : undefined,
    });

    return OperatorPageResponseDto.parse({
      ...result,
      items: result.items.map((operator) => OperatorItemDto.parseEntity(operator)),
    });
  }
}
