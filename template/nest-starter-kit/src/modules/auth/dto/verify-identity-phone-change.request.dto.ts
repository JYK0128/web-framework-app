import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyIdentityPhoneChangeRequestDto {
  @ApiProperty({ type: 'string', description: 'PortOne Identity Verification ID' })
  @IsString()
  @MinLength(1)
  identityVerificationId!: string;
}
