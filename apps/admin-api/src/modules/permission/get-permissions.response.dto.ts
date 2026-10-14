import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { PermissionItemDto } from '#/modules/permission/permission-item.dto';

export class GetPermissionsResponseDto extends ListResponseDto<PermissionItemDto> {
  @ApiProperty({ type: () => [PermissionItemDto] })
  @Type(() => PermissionItemDto)
  override items!: PermissionItemDto[];
}
