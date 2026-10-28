import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { User } from '~/core/database/entities/auth';
import { CustomerItemDto } from '~/modules/customer/profile/customer-item.dto';
import { GetCustomersQuery } from '~/modules/customer/profile/get-customers.query';
import { GetCustomersResponseDto } from '~/modules/customer/profile/get-customers.response.dto';

@Injectable()
@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<GetCustomersQuery, GetCustomersResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetCustomersQuery): Promise<GetCustomersResponseDto> {
    const { input } = query;
    const { where, ...options } = input.toQuery();
    const result = await this.em.findByPage(User, where, {
      ...options,
      populate: ['role', 'profile'],
    });

    return GetCustomersResponseDto.parse({
      ...result,
      items: result.items.map((user) => CustomerItemDto.parseEntity(user)),
    });
  }
}
