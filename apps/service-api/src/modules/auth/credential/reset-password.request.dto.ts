import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

@ApiSchema({ name: 'ResetPasswordDto' })
export class ResetPasswordRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.passwordMinLength, maxLength: SECURITY_CONFIG.password.passwordMaxLength })
  @IsString()
  @MinLength(SECURITY_CONFIG.password.passwordMinLength)
  @MaxLength(SECURITY_CONFIG.password.passwordMaxLength)
  newPassword!: string;
}
