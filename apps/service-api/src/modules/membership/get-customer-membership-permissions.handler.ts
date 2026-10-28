import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { Permission } from '~/core/database/entities/auth.extensions';
import { CustomerMembershipPermissionItemDto } from '~/modules/membership/customer-membership-permission-item.dto';
import { GetCustomerMembershipPermissionsQuery } from '~/modules/membership/get-customer-membership-permissions.query';
import { GetCustomerMembershipPermissionsResponseDto } from '~/modules/membership/get-customer-membership-permissions.response.dto';

@Injectable()
@QueryHandler(GetCustomerMembershipPermissionsQuery)
export class GetCustomerMembershipPermissionsHandler implements IQueryHandler<GetCustomerMembershipPermissionsQuery, GetCustomerMembershipPermissionsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(): Promise<GetCustomerMembershipPermissionsResponseDto> {
    const permissions = await this.em.find(Permission, {}, { orderBy: { code: 'ASC' } });
    return GetCustomerMembershipPermissionsResponseDto.parse({
      items: permissions.map((permission) => CustomerMembershipPermissionItemDto.parseEntity(permission)),
    });
  }
}
