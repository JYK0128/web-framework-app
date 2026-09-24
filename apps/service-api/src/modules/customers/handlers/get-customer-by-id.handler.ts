import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { CustomerDetailResponseDto } from '#/modules/customers/dto';
import { GetCustomerByIdQuery } from '#/modules/customers/queries';

@Injectable()
@QueryHandler(GetCustomerByIdQuery)
export class GetCustomerByIdHandler implements IQueryHandler<GetCustomerByIdQuery, CustomerDetailResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetCustomerByIdQuery): Promise<CustomerDetailResponseDto> {
    const user = await this.em.findOne(User, { id: query.input.customerId }, { populate: ['role'] });
    if (!user) {
      throw new ApplicationError({
        code: 'CUSTOMER_NOT_FOUND',
        message: '고객 정보를 찾을 수 없습니다.',
        status: HttpStatus.NOT_FOUND,
      });
    }

    return CustomerDetailResponseDto.fromPlain({
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
    });
  }
}
