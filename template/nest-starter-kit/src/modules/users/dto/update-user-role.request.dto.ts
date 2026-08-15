import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { ROLE_NAMES, type RoleName } from '#/entities/auth.extentions/role.entity';

export class UpdateUserRoleRequestDto {
  @ApiProperty({ enum: Object.values(ROLE_NAMES), example: ROLE_NAMES.ADMIN })
  @IsIn(Object.values(ROLE_NAMES))
  role!: RoleName;
}
