import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class ChangePasswordRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @Length(SECURITY_CONFIG.password.minLength, SECURITY_CONFIG.password.maxLength)
  newPassword!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @Length(SECURITY_CONFIG.password.minLength, SECURITY_CONFIG.password.maxLength)
  confirmPassword!: string;
}
