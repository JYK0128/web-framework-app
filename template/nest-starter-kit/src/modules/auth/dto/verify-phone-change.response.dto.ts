import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneChangeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string' })
  phoneNumber!: string;

  @ApiProperty({ type: 'boolean' })
  phoneNumberVerified!: boolean;
}
