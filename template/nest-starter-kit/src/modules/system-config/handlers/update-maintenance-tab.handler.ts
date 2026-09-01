import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UpdateMaintenanceTabCommand } from '#/modules/system-config/commands/update-maintenance-tab.command';
import { UpdateMaintenanceTabResponseDto } from '#/modules/system-config/dto';
import { SystemConfigTabUpdateService } from '#/modules/system-config/services/system-config-tab-update.service';

@CommandHandler(UpdateMaintenanceTabCommand)
export class UpdateMaintenanceTabHandler implements ICommandHandler<UpdateMaintenanceTabCommand, UpdateMaintenanceTabResponseDto> {
  constructor(
    private readonly updater: SystemConfigTabUpdateService,
  ) {}

  async execute(command: UpdateMaintenanceTabCommand): Promise<UpdateMaintenanceTabResponseDto> {
    await this.updater.update(
      ['maintenance'],
      (configMap) => {
        configMap.get('maintenance')!.value = { ...command.input.maintenance };
      },
      command.adminUser.id,
    );
    return { ok: true };
  }
}
