import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { updateCredentialPassword } from '@pkg/server-core/auth/user/password.policy';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { ApplicationError } from '@pkg/shared/common';
import { verifyPassword } from '@pkg/shared/server';

import { SECURITY_CONFIG } from '#/app.config';
import { Account } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { ChangePasswordCommand } from '#/modules/auth/credential/change-password.command';
import { ChangePasswordResponseDto } from '#/modules/auth/credential/change-password.response.dto';

@Injectable()
@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand, ChangePasswordResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(command: ChangePasswordCommand): Promise<ChangePasswordResponseDto> {
    if (!SECURITY_CONFIG.credentialAvailable) throw new ApplicationError({ code: 'CREDENTIAL_AUTH_UNAVAILABLE', status: HttpStatus.FORBIDDEN });
    const user = this.principal.ensureUser();
    const account = await this.em.findOne(Account, { user: user.id, providerId: Account.PROVIDER_CREDENTIAL });
    if (!account?.password) throw new ApplicationError({ code: 'PASSWORD_CHANGE_UNAVAILABLE', status: HttpStatus.BAD_REQUEST });
    if (command.input.newPassword !== command.input.confirmPassword) throw new ApplicationError({ code: 'PASSWORD_CONFIRMATION_MISMATCH', status: HttpStatus.BAD_REQUEST });
    if (!await verifyPassword(command.input.currentPassword, account.password)) throw new ApplicationError({ code: 'INVALID_CURRENT_PASSWORD', status: HttpStatus.BAD_REQUEST });
    await updateCredentialPassword(account, command.input.newPassword, SECURITY_CONFIG.password);
    return ChangePasswordResponseDto.parse({ ok: true });
  }
}
