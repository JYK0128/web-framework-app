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
      ['operation'],
      (configMap) => {
        configMap.get('operation')!.value = {
          hours: { ...command.input.hours },
          holidays: command.input.holidays,
          messages: { ...command.input.messages },
        };
      },
      command.adminUser.id,
    );
    return { ok: true };
  }
}
