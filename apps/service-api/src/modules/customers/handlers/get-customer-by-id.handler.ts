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
    const user = await this.em.findOne(User, { id: query.input.customerId }, { populate: ['role', 'profile'] });
    if (!user) {
      throw new ApplicationError({
        code: 'CUSTOMER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
      });
    }
    if (!user.profile) {
      throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }

    return CustomerDetailResponseDto.from(user);
  }
}
