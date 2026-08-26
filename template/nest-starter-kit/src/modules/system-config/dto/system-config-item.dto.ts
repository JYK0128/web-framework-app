import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { ConfigCategory, SystemConfig } from '#/entities/system-config/system-config.entity';

export type SystemConfigKey
  = | 'operation.hours'
    | 'operation.holidays'
    | 'operation.messages'
    | 'maintenance.emergency'
    | 'maintenance.scheduled'
    | 'auth.policy'
    | 'notification.slack'
    | 'inquiry.policy';

export class SystemConfigItemDto extends DtoType(SystemConfig) {
  constructor(config?: SystemConfig) {
    super();
    if (config) {
      this.key = config.key;
      this.category = config.category;
      this.value = config.value;
      this.isPublic = config.isPublic;
      this.description = config.description;
    }
  }

  @ApiProperty({ example: 'operation.hours', description: '설정 키' })
  override key!: string;

  @ApiEnum({ enum: ConfigCategory, example: ConfigCategory.OPERATION, description: '설정 카테고리' })
  override category!: ConfigCategory;

  @ApiProperty({ description: '설정 값' })
  override value!: Record<string, unknown>;

  @ApiProperty({ example: true, description: '일반 공개 여부' })
  override isPublic!: boolean;

  @ApiProperty({ type: String, example: '고객센터 기본 운영시간 설정', description: '설정 설명', nullable: true })
  override description: string | null = null;
}
