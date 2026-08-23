import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';

import { SystemConfig as SystemConfigEntity } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { RedisKey, RedisService } from '#/infra/redis';
import { UpdateSystemConfigCommand } from '#/modules/system-config/commands/update-system-config.command';
import { type SystemConfigKey, UpdateSystemConfigRequestDto, UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
  ) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const configEntity = await this.identifyConfig(command.input.key);
    this.verifyInput(command.input.input);
    return this.process(configEntity, command.input.key, command.input.input, command.input.adminUserId);
  }

  private async identifyConfig(key: SystemConfigKey): Promise<SystemConfigEntity> {
    const entity = await this.em.findOne(SystemConfigEntity, { key }, { filters: false });
    if (!entity) {
      throw new ApplicationError({
        code: 'SYSTEM_CONFIG_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: `시스템 설정을 찾을 수 없습니다: ${key}`,
      });
    }
    return entity;
  }

  private verifyInput(input: UpdateSystemConfigRequestDto): void {
    if (!input || typeof input.value !== 'object') {
      throw new ApplicationError({
        code: 'VALIDATION_ERROR',
        status: HttpStatus.BAD_REQUEST,
        message: '설정값이 제공되지 않았습니다.',
      });
    }
  }

  private async process(
    configEntity: SystemConfigEntity,
    key: SystemConfigKey,
    input: UpdateSystemConfigRequestDto,
    adminUserId?: string,
  ): Promise<UpdateSystemConfigResponseDto> {
    configEntity.value = input.value;
    if (adminUserId) {
      configEntity.updatedBy = adminUserId;
    }

    await this.em.flush();
    await this.redis.hSet(RedisKey.config.hash, key, JSON.stringify(input.value));

    return new UpdateSystemConfigResponseDto(configEntity);
  }
}
