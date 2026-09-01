import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { UpdateMessagesTabCommand } from '#/modules/system-config/commands/update-messages-tab.command';
import { UpdateMessagesTabResponseDto } from '#/modules/system-config/dto';
import { SystemConfigTabUpdateService } from '#/modules/system-config/services/system-config-tab-update.service';

@CommandHandler(UpdateMessagesTabCommand)
export class UpdateMessagesTabHandler implements ICommandHandler<UpdateMessagesTabCommand, UpdateMessagesTabResponseDto> {
  constructor(
    private readonly updater: SystemConfigTabUpdateService,
  ) {}

  async execute(command: UpdateMessagesTabCommand): Promise<UpdateMessagesTabResponseDto> {
    await this.updater.update(
      ['operation.messages'],
      (configMap) => {
        configMap.get('operation.messages')!.value = { ...command.input.messages };
      },
      command.adminUser.id,
    );
    return { ok: true };
  }
}
