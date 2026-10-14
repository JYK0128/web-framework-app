import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { RoleItemDto } from '#/modules/roles/role-item.dto';

export class GetRolesResponseDto extends ListResponseDto<RoleItemDto> {
  @ApiProperty({ type: () => [RoleItemDto] })
  @Type(() => RoleItemDto)
  override items!: RoleItemDto[];
}
