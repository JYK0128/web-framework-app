import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '~/core/database/entities/auth';
import { AppEntityManager } from '~/core/database/entity-manager';
import { CustomerItemDto } from '~/modules/customer/profile/customer-item.dto';
import { GetCustomersQuery } from '~/modules/customer/profile/get-customers.query';
import { GetCustomersResponseDto } from '~/modules/customer/profile/get-customers.response.dto';

@Injectable()
@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<GetCustomersQuery, GetCustomersResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetCustomersQuery): Promise<GetCustomersResponseDto> {
    const { input } = query;
    const result = await this.em.findByPage(User, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['role', 'profile'],
    });

    return GetCustomersResponseDto.parse({
      ...result,
      items: result.items.map((user) => CustomerItemDto.parseEntity(user)),
    });
  }
}
