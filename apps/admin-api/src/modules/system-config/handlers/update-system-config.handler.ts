import { Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { SystemConfigCode } from '#/entities/system-configs/system-config.entity';
import { Upload, UploadStatus } from '#/entities/uploads/upload.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { UpdateSystemConfigCommand } from '#/modules/system-config/commands';
import type { UpdateSystemConfigResponseDto } from '#/modules/system-config/system-config.interfaces';
import { SystemConfigService } from '#/modules/system-config/system-config.service';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(private readonly service: SystemConfigService, private readonly em: AppEntityManager) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const updatedKeys = Object.keys(command.input) as SystemConfigCode[];
    await this.service.update(command.input);
    const iconUrls = Object.values(command.input.oauth ?? {})
      .map((provider) => provider?.iconUrl)
      .filter((url): url is string => Boolean(url));
    if (iconUrls.length > 0) {
      const uploads = await this.em.find(Upload, { url: { $in: iconUrls } });
      for (const upload of uploads) upload.status = UploadStatus.READY;
    }
    return { ok: true, updatedKeys };
  }
}
