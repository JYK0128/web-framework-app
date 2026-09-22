import { Injectable } from '@nestjs/common';
import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

import { CustomerListResponseDto, type CustomerItemDto } from '../dto';
import { GetCustomersQuery } from '../queries';

@Injectable()
@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<GetCustomersQuery, CustomerListResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetCustomersQuery): Promise<CustomerListResponseDto> {
    const { input } = query;
    const result = await this.em.findByPage(User, input.toFilterQuery(), {
      ...input.toPageOptions(),
      populate: ['role'],
    });

    return CustomerListResponseDto.fromPlain({
      ...result,
      items: result.items.map((user) => this.toItem(user)),
    });
  }

  private toItem(user: User): CustomerItemDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      banned: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roleCode: user.role?.code ?? null,
      roleLabel: user.role?.label ?? null,
    } as CustomerItemDto;
  }
}
