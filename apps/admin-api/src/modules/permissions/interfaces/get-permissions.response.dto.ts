import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { PermissionItemDto } from './permission-item.dto';

export class GetPermissionsResponseDto extends ListResponseDto<PermissionItemDto> {
  @ApiProperty({ type: () => [PermissionItemDto] })
  @Type(() => PermissionItemDto)
  override items!: PermissionItemDto[];
}
