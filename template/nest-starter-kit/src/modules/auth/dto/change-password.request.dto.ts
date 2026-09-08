import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { IsEqualTo } from '#/common/decorators/is-equal-to.decorator';
import { IsNotEqualTo } from '#/common/decorators/is-not-equal-to.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

@ApiSchema({ name: 'ChangePasswordRequest' })
export class ChangePasswordRequestDto extends DtoType(User) {
  @ApiProperty({ type: 'string' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @IsNotEqualTo('currentPassword', { message: 'validation.passwordSameAsCurrent' })
  newPassword!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsEqualTo('newPassword', { message: 'login.passwordMismatch' })
  confirmPassword!: string;
}
