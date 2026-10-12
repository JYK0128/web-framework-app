import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';

@ApiSchema({ name: 'TwoFactorCodeRequestDto' })
export class EnableTwoFactorRequestDto {
  @ApiProperty({ type: String, minLength: SECURITY_CONFIG.twoFactor.digits, maxLength: SECURITY_CONFIG.twoFactor.digits })
  @IsString()
  @Length(SECURITY_CONFIG.twoFactor.digits, SECURITY_CONFIG.twoFactor.digits)
  code!: string;
}
