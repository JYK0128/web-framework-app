import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyIdentityRequestDto {
  @ApiProperty({ type: String, maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  identityVerificationId!: string;
}

export class VerifyIdentityResponseDto {
  @ApiProperty({ type: Boolean })
  phoneNumberVerified!: boolean;
}
