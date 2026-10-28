import { HttpStatus } from '@nestjs/common';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '~/core/database/entities/auth';

export async function findCustomer(em: AppEntityManager, customerId: string): Promise<User> {
  const customer = await em.findOne(User, { id: customerId }, { populate: ['role'], filters: false });
  if (!customer || customer.deletedAt) {
    throw new ApplicationError({ code: 'CUSTOMER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  }
  return customer;
}
