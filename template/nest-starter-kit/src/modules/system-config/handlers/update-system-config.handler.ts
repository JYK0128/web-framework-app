import { Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { SystemConfig as SystemConfigEntity } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { RedisKey, RedisService } from '#/infra/redis';
import { UpdateSystemConfigCommand } from '#/modules/system-config/commands/update-system-config.command';
import { UpdateSystemConfigResponseDto } from '#/modules/system-config/dto';

@Injectable()
@CommandHandler(UpdateSystemConfigCommand)
export class UpdateSystemConfigHandler implements ICommandHandler<UpdateSystemConfigCommand, UpdateSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly redis: RedisService,
  ) {}

  async execute(command: UpdateSystemConfigCommand): Promise<UpdateSystemConfigResponseDto> {
    const { key, input, adminUserId } = command.payload;

    // 1. identify: DB 엔티티 식별
    const configEntity = await this.em.findOne(SystemConfigEntity, { key }, { filters: false });
    if (!configEntity) {
      throw new NotFoundException(`시스템 설정을 찾을 수 없습니다: ${key}`);
    }

    // 2. verify: 값 갱신
    configEntity.value = input.value;
    if (adminUserId) {
      configEntity.updatedBy = adminUserId;
    }

    // 3. process: 엔티티 갱신, DB 커밋 및 Redis 캐시 갱신
    await this.em.flush();
    await this.redis.hSet(RedisKey.config.hash, key, JSON.stringify(input.value));

    return new UpdateSystemConfigResponseDto(configEntity);
  }
}
