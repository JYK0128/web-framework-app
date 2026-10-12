import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import { User } from '#/core/database/entities/auth';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { DisableTwoFactorCommand } from '#/modules/auth/two-factor/disable-two-factor.command';
import { DisableTwoFactorResponseDto } from '#/modules/auth/two-factor/disable-two-factor.response.dto';

@Injectable()
@CommandHandler(DisableTwoFactorCommand)
export class DisableTwoFactorHandler implements ICommandHandler<DisableTwoFactorCommand, DisableTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<DisableTwoFactorResponseDto> {
    if (SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_REQUIRED', status: HttpStatus.FORBIDDEN });
    const user = await this.em.findOne(User, { id: this.principal.ensureUser().id }, { filters: false });
    if (!user) throw new ApplicationError({ code: 'USER_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    user.twoFactorEnabled = false;
    return DisableTwoFactorResponseDto.parse({ enabled: false });
  }
}
