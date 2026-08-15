import { IsEnum } from 'class-validator';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { RoleName } from '#/entities/auth.extentions/role.entity';
import { User } from '#/entities/auth/user.entity';

export class UpdateUserRoleRequestDto extends DtoType(User) {
  @ApiEnum({ enum: RoleName, example: RoleName.ADMIN })
  @IsEnum(RoleName)
  override role!: RoleName;
}
