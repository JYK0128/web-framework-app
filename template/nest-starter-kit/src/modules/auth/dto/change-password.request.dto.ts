import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { IsEqualTo } from '#/common/decorators/is-equal-to.decorator';
import { IsNotEqualTo } from '#/common/decorators/is-not-equal-to.decorator';
import { IsStrongPassword } from '#/common/decorators/is-strong-password.decorator';
import { env } from '#/env';

@ApiSchema({ name: 'ChangePasswordRequest' })
export class ChangePasswordRequestDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty({ minLength: env.PASSWORD_MIN_LENGTH, example: 'newPassword123!' })
  @IsStrongPassword()
  @IsNotEqualTo('currentPassword', { message: 'validation.passwordSameAsCurrent' })
  newPassword!: string;

  @ApiProperty({ example: 'newPassword123!' })
  @IsString()
  @IsEqualTo('newPassword', { message: 'validation.passwordMismatch' })
  confirmPassword!: string;
}
