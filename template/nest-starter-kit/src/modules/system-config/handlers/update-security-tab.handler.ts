import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UpdateSecurityTabCommand } from '#/modules/system-config/commands/update-security-tab.command';
import { UpdateSecurityTabResponseDto } from '#/modules/system-config/dto';
import { SystemConfigTabUpdateService } from '#/modules/system-config/services/system-config-tab-update.service';

@CommandHandler(UpdateSecurityTabCommand)
export class UpdateSecurityTabHandler implements ICommandHandler<UpdateSecurityTabCommand, UpdateSecurityTabResponseDto> {
  constructor(
    private readonly updater: SystemConfigTabUpdateService,
  ) {}

  async execute(command: UpdateSecurityTabCommand): Promise<UpdateSecurityTabResponseDto> {
    await this.updater.update(
      ['security'],
      (configMap) => {
        configMap.get('security')!.value = { ...command.input.security };
      },
      command.adminUser.id,
    );
    return { ok: true };
  }
}
