import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SystemContext } from '#/common/contexts/system.context';
import { ReloadSystemConfigCommand } from '#/modules/system-config/commands/reload-system-config.command';
import { ReloadSystemConfigResponseDto } from '#/modules/system-config/dto/reload-system-config.response.dto';

@CommandHandler(ReloadSystemConfigCommand)
export class ReloadSystemConfigHandler implements ICommandHandler<ReloadSystemConfigCommand, ReloadSystemConfigResponseDto> {
  constructor(private readonly systemContext: SystemContext) {}

  async execute(): Promise<ReloadSystemConfigResponseDto> {
    const reloadedKeys = await this.identify();
    this.verify(reloadedKeys);
    return this.process(reloadedKeys);
  }

  private identify(): Promise<ReloadSystemConfigResponseDto['reloadedKeys']> {
    return this.systemContext.reloadFromDatabase();
  }

  private verify(keys: ReloadSystemConfigResponseDto['reloadedKeys']): void {
    if (keys.some((key) => !key)) {
      throw new Error('시스템 설정 키를 확인할 수 없습니다.');
    }
  }

  private process(reloadedKeys: ReloadSystemConfigResponseDto['reloadedKeys']): ReloadSystemConfigResponseDto {
    return Object.assign(new ReloadSystemConfigResponseDto(), { ok: true, reloadedKeys });
  }
}
