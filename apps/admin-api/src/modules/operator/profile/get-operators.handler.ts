import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '~/core/database/entities/auth';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetOperatorsQuery } from '~/modules/operator/profile/get-operators.query';
import { GetOperatorsResponseDto } from '~/modules/operator/profile/get-operators.response.dto';
import { OperatorItemDto } from '~/modules/operator/profile/operator-item.dto';
import { OperatorStatus } from '~/modules/operator/profile/operator-status.enum';

@Injectable()
@QueryHandler(GetOperatorsQuery)
export class GetOperatorsHandler implements IQueryHandler<GetOperatorsQuery, GetOperatorsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetOperatorsQuery): Promise<GetOperatorsResponseDto> {
    const result = await this.em.findByPage(User, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['role', 'profile'],
      filters: query.input.includeDeleted || query.input.status === OperatorStatus.DELETED ? false : undefined,
    });

    return GetOperatorsResponseDto.parse({
      ...result,
      items: result.items.map((operator) => OperatorItemDto.parseEntity(operator)),
    });
  }
}
