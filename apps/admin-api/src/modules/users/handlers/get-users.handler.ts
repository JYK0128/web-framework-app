import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetUsersResponseDto, UserItemDto, UserStatus } from '#/modules/users/interfaces';
import { GetUsersQuery } from '#/modules/users/queries';

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersHandler implements IQueryHandler<GetUsersQuery, GetUsersResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetUsersQuery): Promise<GetUsersResponseDto> {
    const result = await this.em.findByPage(User, query.input.toFilterQuery(), {
      ...query.input.toPageOptions(),
      populate: ['role'],
      filters: query.input.includeDeleted || query.input.status === UserStatus.DELETED ? false : undefined,
    });

    return GetUsersResponseDto.fromPlain({
      ...result,
      items: result.items.map((user) => UserItemDto.from(user)),
    });
  }
}
