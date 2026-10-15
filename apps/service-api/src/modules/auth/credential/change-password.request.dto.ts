import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class ChangePasswordRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.passwordMinLength, maxLength: SECURITY_CONFIG.password.passwordMaxLength })
  @IsString()
  @Length(SECURITY_CONFIG.password.passwordMinLength, SECURITY_CONFIG.password.passwordMaxLength)
  newPassword!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.passwordMinLength, maxLength: SECURITY_CONFIG.password.passwordMaxLength })
  @IsString()
  @Length(SECURITY_CONFIG.password.passwordMinLength, SECURITY_CONFIG.password.passwordMaxLength)
  confirmPassword!: string;
}
