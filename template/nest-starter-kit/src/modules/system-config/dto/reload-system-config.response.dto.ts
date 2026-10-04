import { ApiProperty } from '@nestjs/swagger';

import { SystemConfigKey } from '#/entities/system-configs/system-config.entity';

export class ReloadSystemConfigResponseDto {
  @ApiProperty({ type: Boolean })
  ok!: boolean;

  @ApiProperty({ enum: SystemConfigKey, enumName: 'SystemConfigKey', isArray: true })
  reloadedKeys!: SystemConfigKey[];
}
