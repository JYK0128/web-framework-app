import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';
import { TwoFactor } from '#/core/database/entities/auth.extensions';
import { AppEntityManager } from '#/core/database/entity-manager';
import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { DisableTwoFactorCommand } from '#/modules/auth/commands';
import { DisableTwoFactorResponseDto } from '#/modules/auth/dto';
import { identifyUser } from '#/modules/auth/handlers/profile-security.helpers';

@Injectable()
@CommandHandler(DisableTwoFactorCommand)
export class DisableTwoFactorHandler implements ICommandHandler<DisableTwoFactorCommand, DisableTwoFactorResponseDto> {
  constructor(private readonly em: AppEntityManager, private readonly principal: PrincipalContext) {}

  async execute(): Promise<DisableTwoFactorResponseDto> {
    if (SECURITY_CONFIG.twoFactor.required) throw new ApplicationError({ code: 'TWO_FACTOR_REQUIRED', status: HttpStatus.FORBIDDEN });
    const user = await identifyUser(this.em, this.principal);
    const twoFactor = await this.em.findOne(TwoFactor, { user: user.id }, { filters: false });
    if (twoFactor) this.em.remove(twoFactor);
    user.twoFactorEnabled = false;
    return DisableTwoFactorResponseDto.fromPlain({ enabled: false });
  }
}
