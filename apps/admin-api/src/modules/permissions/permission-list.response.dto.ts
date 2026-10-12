import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { PermissionItemDto } from '#/modules/permissions/permission-item.dto';

export class PermissionListResponseDto extends ListResponseDto<PermissionItemDto> {
  @ApiProperty({ type: () => [PermissionItemDto] })
  @Type(() => PermissionItemDto)
  override items!: PermissionItemDto[];
}
