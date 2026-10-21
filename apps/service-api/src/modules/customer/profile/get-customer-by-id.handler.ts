import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '~/core/database/entities/auth';
import { AppEntityManager } from '~/core/database/entity-manager';
import { GetCustomerResponseDto } from '~/modules/customer/profile/get-customer.response.dto';
import { GetCustomerByIdQuery } from '~/modules/customer/profile/get-customer-by-id.query';

@Injectable()
@QueryHandler(GetCustomerByIdQuery)
export class GetCustomerByIdHandler implements IQueryHandler<GetCustomerByIdQuery, GetCustomerResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: GetCustomerByIdQuery): Promise<GetCustomerResponseDto> {
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

    return GetCustomerResponseDto.parseEntity(user);
  }
}
