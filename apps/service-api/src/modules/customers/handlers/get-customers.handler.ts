import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CustomerItemDto, CustomerPageResponseDto } from '#/modules/customers/dto';
import { GetCustomersQuery } from '#/modules/customers/queries';

@Injectable()
@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<GetCustomersQuery, CustomerPageResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetCustomersQuery): Promise<CustomerPageResponseDto> {
    const { input } = query;
    const result = await this.em.findByPage(User, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['role', 'profile'],
    });

    return CustomerPageResponseDto.fromPlain({
      ...result,
      items: result.items.map((user) => CustomerItemDto.from(user)),
    });
  }
}
