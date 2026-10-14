import { Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { CustomerMembershipItemDto } from '#/modules/memberships/customer-membership-item.dto';
import { GetCustomerMembershipsQuery } from '#/modules/memberships/get-customer-memberships.query';
import { GetCustomerMembershipsResponseDto } from '#/modules/memberships/get-customer-memberships.response.dto';

@Injectable()
@QueryHandler(GetCustomerMembershipsQuery)
export class GetCustomerMembershipsHandler implements IQueryHandler<GetCustomerMembershipsQuery, GetCustomerMembershipsResponseDto> {
  constructor(private readonly em: AppEntityManager) {}
  async execute(): Promise<GetCustomerMembershipsResponseDto> {
    const roles = await this.em.find(Role, {}, { orderBy: { code: 'ASC' } });
    return GetCustomerMembershipsResponseDto.parse({ items: await Promise.all(roles.map(async (role) => CustomerMembershipItemDto.parseEntity(role, await this.em.count(User, { role: role.id, deletedAt: null }, { filters: false })))) });
  }
}
