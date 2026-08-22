import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@pkg/shared/common';
import { IsString } from 'class-validator';

import { IsEqualTo } from '#/common/decorators/is-equal-to.decorator';
import { IsNotEqualTo } from '#/common/decorators/is-not-equal-to.decorator';
import { IsStrongPassword } from '#/common/decorators/is-strong-password.decorator';

@ApiSchema({ name: 'ChangePasswordRequest' })
export class ChangePasswordRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ type: 'string', minLength: PASSWORD_MIN_LENGTH, maxLength: PASSWORD_MAX_LENGTH })
  @IsStrongPassword()
  @IsNotEqualTo('currentPassword', { message: 'validation.passwordSameAsCurrent' })
  newPassword!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsEqualTo('newPassword', { message: 'validation.passwordMismatch' })
  confirmPassword!: string;
}
