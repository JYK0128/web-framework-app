import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';

export async function identifyUser(em: AppEntityManager, principal: PrincipalContext): Promise<User> {
  const user = await em.findOne(User, { id: principal.ensureUser().id }, { filters: false });
  if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
  return user;
}

export function assertVerificationUnlocked(twoFactor: TwoFactor): void {
  if (twoFactor.isLocked) throw new ApplicationError({ code: 'TWO_FACTOR_SETUP_LOCKED', status: HttpStatus.TOO_MANY_REQUESTS });
}
