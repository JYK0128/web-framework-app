import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyIdentityRequestDto {
  @ApiProperty({ type: String, description: 'PortOne identity verification ID' })
  @IsString()
  @IsNotEmpty()
  identityVerificationId!: string;
}

export class VerifyIdentityResponseDto {
  @ApiProperty({ type: Boolean })
  phoneNumberVerified!: boolean;
}
