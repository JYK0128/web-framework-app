import { ApiProperty } from '@nestjs/swagger';
import { ToLowerCase } from '@pkg/server-core/http/decorators';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '~/app.config';

export class RegisterRequestDto extends BaseDto {
  @ApiProperty({ type: String, format: 'email' })
  @ToLowerCase()
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.passwordMinLength, maxLength: SECURITY_CONFIG.password.passwordMaxLength })
  @IsString()
  @MinLength(SECURITY_CONFIG.password.passwordMinLength)
  @MaxLength(SECURITY_CONFIG.password.passwordMaxLength)
  password!: string;

  @ApiProperty({ type: String, maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
