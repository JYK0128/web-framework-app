import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { type IUserAuthService, USER_AUTH_SERVICE } from '#/core/auth/user/user-auth.interface';
import { User } from '#/core/database/entities/auth';
import { Role } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { UpdateOperatorRoleCommand } from '#/modules/operators/commands';
import { OperatorActionResponseDto } from '#/modules/operators/dto';
import { assertNotSelf, assertSuperAdmin, findOperator, ok } from '#/modules/operators/handlers/operator-actions.helpers';

@Injectable()
@CommandHandler(UpdateOperatorRoleCommand)
export class UpdateOperatorRoleHandler implements ICommandHandler<UpdateOperatorRoleCommand, OperatorActionResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: UpdateOperatorRoleCommand): Promise<OperatorActionResponseDto> {
    assertSuperAdmin(this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    assertNotSelf(operator, this.principal);
    if (operator.deletedAt) {
      throw new ApplicationError({ code: 'DELETED_OPERATOR_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: command.input.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (operator.role?.code === 'super_admin' && role.code !== 'super_admin') {
      const count = await this.em.count(User, { role: operator.role.id, deletedAt: null }, { filters: false });
      if (count <= 1) {
        throw new ApplicationError({ code: 'LAST_SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT });
      }
    }
    operator.role = role;
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return ok();
  }
}
