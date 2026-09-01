import { ApiProperty } from '@nestjs/swagger';

export class VerifyPhoneResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string' })
  phoneNumber!: string;

  @ApiProperty({ type: 'boolean' })
  phoneNumberVerified!: boolean;
}
