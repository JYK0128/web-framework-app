import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { ROLE_NAMES, type RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class UpdateUserRoleRequestDto extends DtoType(User) {
  @ApiProperty({ enum: ROLE_NAMES, example: ROLE_NAMES.ADMIN })
  @IsEnum(ROLE_NAMES)
  override role!: RoleName;
}
