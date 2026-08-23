import { ApiProperty } from '@nestjs/swagger';

import { SystemConfigItemDto } from './system-config-item.dto';

export class GetAdminSystemConfigResponseDto {
  @ApiProperty({ type: [SystemConfigItemDto], description: '전체 시스템 설정 목록' })
  items!: SystemConfigItemDto[];
}
