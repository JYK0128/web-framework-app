import { HttpStatus } from '@nestjs/common';
import { PrincipalContext } from '@pkg/server-core/http/contexts';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '~/core/database/entities/auth';
import { RoleCode } from '~/core/database/entities/auth.extensions';
import { AppEntityManager } from '~/core/database/entity-manager';

export async function findOperator(em: AppEntityManager, operatorId: string): Promise<User> {
  const operator = await em.findOne(User, { id: operatorId }, { populate: ['role'], filters: false });
  if (!operator) throw new ApplicationError({ code: 'OPERATOR_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return operator;
}

export function assertNotSelf(operatorId: string, principal: PrincipalContext): void {
  if (operatorId === principal.ensureUser().id) {
    throw new ApplicationError({ code: 'SELF_ACCOUNT_OPERATION_NOT_ALLOWED', status: HttpStatus.CONFLICT });
  }
}

export function assertNotSuperAdmin(operator: User): void {
  if (operator.role?.code === RoleCode.SUPER_ADMIN) {
    throw new ApplicationError({ code: 'SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT });
  }
}
