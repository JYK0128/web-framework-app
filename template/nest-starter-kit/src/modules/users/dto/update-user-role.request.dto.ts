import { IsEnum } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { RoleKey } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class UpdateUserRoleRequestDto extends DtoType(User) {
  @ApiEnum({ enum: RoleKey })
  @IsEnum(RoleKey)
  override role!: RoleKey;
}
