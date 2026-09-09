import { ApiProperty } from '@nestjs/swagger';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { SystemConfigKey } from '#/entities/system-config/system-config.entity';

export class UpdateSystemConfigResponseDto {
  @ApiProperty({ example: true, description: '성공 여부' })
  ok: boolean = true;

  @ApiEnumOptional({
    enum: SystemConfigKey,
    isArray: true,
    description: '수정된 설정 키 목록',
  })
  updatedKeys?: SystemConfigKey[];
}
