import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

export class UpdateSystemConfigRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ description: '수정할 설정 값' })
  @IsDefined({ message: '설정 값은 필수입니다.' })
  override value!: Record<string, unknown>;
}
