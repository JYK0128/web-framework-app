import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { type IUserAuthService, USER_AUTH_SERVICE } from '@pkg/server-core/auth/user/user-auth.interface';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { ApplicationError } from '@pkg/shared/common';

import { User } from '#/core/database/entities/auth';
import { Role, RoleCode } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { UpdateOperatorRoleCommand } from '#/modules/operator/access/update-operator-role.command';
import { UpdateOperatorRoleResponseDto } from '#/modules/operator/access/update-operator-role.response.dto';
import { assertNotSelf, findOperator } from '#/modules/operator/operator-actions.helpers';

@Injectable()
@CommandHandler(UpdateOperatorRoleCommand)
export class UpdateOperatorRoleHandler implements ICommandHandler<UpdateOperatorRoleCommand, UpdateOperatorRoleResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext, @Inject(USER_AUTH_SERVICE) private readonly userAuthService: IUserAuthService) {}

  async execute(command: UpdateOperatorRoleCommand): Promise<UpdateOperatorRoleResponseDto> {
    assertNotSelf(command.input.operatorId, this.principal);
    const operator = await findOperator(this.em, command.input.operatorId);
    if (operator.deletedAt) {
      throw new ApplicationError({ code: 'DELETED_OPERATOR_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }
    const role = await this.em.findOne(Role, { code: command.input.data.role }, { filters: false });
    if (!role || role.deletedAt) {
      throw new ApplicationError({ code: 'ROLE_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }
    if (operator.role?.code === RoleCode.SUPER_ADMIN && role.code !== RoleCode.SUPER_ADMIN) {
      const count = await this.em.count(User, { role: operator.role.id, deletedAt: null }, { filters: false });
      if (count <= 1) {
        throw new ApplicationError({ code: 'LAST_SUPER_ADMIN_PROTECTED', status: HttpStatus.CONFLICT });
      }
    }
    operator.role = role;
    await this.userAuthService.revokeUserTokens?.(operator.id);
    return UpdateOperatorRoleResponseDto.parse({ ok: true });
  }
}
