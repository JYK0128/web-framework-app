import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';

export async function findCustomer(em: AppEntityManager, customerId: string): Promise<User> {
  const customer = await em.findOne(User, { id: customerId }, { populate: ['role'], filters: false });
  if (!customer || customer.deletedAt) {
    throw new ApplicationError({ code: 'CUSTOMER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  }
  return customer;
}
