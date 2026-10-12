import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { OperatorActionResponseDto } from '#/modules/operators/dto';

export const ok = () => OperatorActionResponseDto.fromPlain({ ok: true });

export async function findOperator(em: AppEntityManager, operatorId: string): Promise<User> {
  const operator = await em.findOne(User, { id: operatorId }, { populate: ['role'], filters: false });
  if (!operator) throw new ApplicationError({ code: 'OPERATOR_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return operator;
}

export function assertNotSelf(operator: User, principal: PrincipalContext): void {
  if (operator.id === principal.ensureUser().id) {
    throw new ApplicationError({ code: 'SELF_ACCOUNT_OPERATION_NOT_ALLOWED', status: HttpStatus.CONFLICT });
  }
}

export function assertSuperAdmin(principal: PrincipalContext): void {
  if (!principal.ensureUser().roles.includes('super_admin')) {
    throw new ApplicationError({ code: 'SUPER_ADMIN_REQUIRED', status: HttpStatus.FORBIDDEN });
  }
}

export function assertNotSuperAdmin(operator: User): void {
  if (operator.role?.code === 'super_admin') {
    throw new ApplicationError({ code: 'SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT });
  }
}
