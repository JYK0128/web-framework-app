import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';
import { BaseDto } from '#/common/interfaces/base/base.dto';

export class RegisterRequestDto {
  @ApiProperty({ type: String, format: 'email' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
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

export class RegisterResponseDto extends BaseDto {
  @ApiProperty({ type: Boolean })
  emailVerificationRequired!: boolean;

  @ApiProperty({ type: Boolean })
  verificationEmailSent!: boolean;
}
