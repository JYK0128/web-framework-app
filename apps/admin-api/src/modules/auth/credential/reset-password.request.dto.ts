import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { SECURITY_CONFIG } from '#/app.config';
import { VerifyPasswordResetRequestDto } from '#/modules/auth/credential/verify-password-reset.request.dto';

@ApiSchema({ name: 'ResetPasswordDto' })
export class ResetPasswordRequestDto extends VerifyPasswordResetRequestDto { @ApiProperty({ minLength: SECURITY_CONFIG.password.minLength, maxLength: SECURITY_CONFIG.password.maxLength }) @IsString() @MinLength(SECURITY_CONFIG.password.minLength) @MaxLength(SECURITY_CONFIG.password.maxLength) newPassword!: string; }
