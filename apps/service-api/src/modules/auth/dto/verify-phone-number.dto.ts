import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyPhoneNumberRequestDto {
  @ApiProperty({ type: String, description: 'PortOne verification transaction ID' })
  @IsString()
  @IsNotEmpty()
  identityVerificationId!: string;
}

export class VerifyPhoneNumberResponseDto {
  @ApiProperty({ type: Boolean })
  phoneNumberVerified!: boolean;
}
