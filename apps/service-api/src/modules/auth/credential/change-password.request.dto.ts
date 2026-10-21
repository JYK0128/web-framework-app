import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsNotEmpty, IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '~/app.config';

export class ChangePasswordRequestDto extends BaseDto {
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
