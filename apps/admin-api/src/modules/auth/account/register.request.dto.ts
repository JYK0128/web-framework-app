import { ApiProperty } from '@nestjs/swagger';
import { ToLowerCase } from '@pkg/server-core/http/decorators/to-lower-case.decorator';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class RegisterRequestDto extends BaseDto {
  @ApiProperty({ type: String, format: 'email' })
  @ToLowerCase()
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength })
  @IsString()
  @MinLength(SECURITY_CONFIG.password.minLength)
  @MaxLength(SECURITY_CONFIG.password.maxLength)
  password!: string;

  @ApiProperty({ type: String, maxLength: 120 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
