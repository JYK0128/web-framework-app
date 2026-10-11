import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { RoleItemDto } from '#/modules/roles/dto/role-item.dto';

export class RoleListResponseDto extends ListResponseDto<RoleItemDto> {
  @ApiProperty({ type: () => [RoleItemDto] })
  @Type(() => RoleItemDto)
  override items!: RoleItemDto[];
}
