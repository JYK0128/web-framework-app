import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UpdateOperationsTabCommand } from '#/modules/system-config/commands/update-operations-tab.command';
import { UpdateOperationsTabResponseDto } from '#/modules/system-config/dto';
import { SystemConfigTabUpdateService } from '#/modules/system-config/services/system-config-tab-update.service';

@CommandHandler(UpdateOperationsTabCommand)
export class UpdateOperationsTabHandler implements ICommandHandler<UpdateOperationsTabCommand, UpdateOperationsTabResponseDto> {
  constructor(
    private readonly updater: SystemConfigTabUpdateService,
  ) {}

  async execute(command: UpdateOperationsTabCommand): Promise<UpdateOperationsTabResponseDto> {
    await this.updater.update(
      ['operation.hours', 'operation.holidays'],
      (configMap) => {
        configMap.get('operation.hours')!.value = { ...command.input.hours };
        configMap.get('operation.holidays')!.value = { holidays: command.input.holidays };
      },
      command.adminUser.id,
    );
    return { ok: true };
  }
}
