import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

export class EnableTwoFactorRequestDto extends BaseDto {
  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.twoFactor.digits, maxLength: SECURITY_CONFIG.twoFactor.digits })
  @IsString()
  @Length(SECURITY_CONFIG.twoFactor.digits, SECURITY_CONFIG.twoFactor.digits)
  code!: string;
}
