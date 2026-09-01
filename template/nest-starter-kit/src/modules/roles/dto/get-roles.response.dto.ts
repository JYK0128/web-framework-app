import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { RoleDto } from './role.dto';

export class GetRolesResponseDto extends ListResponseDto<RoleDto> {
  @ApiProperty({ type: () => [RoleDto] })
  override items!: RoleDto[];

  @ApiProperty({ type: () => [RoleDto] })
  roles!: RoleDto[];
}
