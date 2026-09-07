import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { ReloadSystemConfigCommand } from '#/modules/system-config/commands/reload-system-config.command';
import { ReloadSystemConfigResponseDto } from '#/modules/system-config/dto/reload-system-config.response.dto';

@CommandHandler(ReloadSystemConfigCommand)
export class ReloadSystemConfigHandler implements ICommandHandler<ReloadSystemConfigCommand, ReloadSystemConfigResponseDto> {
  constructor(private readonly systemContext: SystemContext) {}

  async execute(): Promise<ReloadSystemConfigResponseDto> {
    const reloadedKeys = await this.systemContext.reloadFromDatabase();
    return Object.assign(new ReloadSystemConfigResponseDto(), { ok: true, reloadedKeys });
  }
}
