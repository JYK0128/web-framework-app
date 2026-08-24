import { ApiProperty } from '@nestjs/swagger';

export class VerifyIdentityPhoneChangeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string' })
  name!: string;

  @ApiProperty({ type: 'string' })
  phoneNumber!: string;

  @ApiProperty({ type: 'boolean' })
  phoneNumberVerified!: boolean;

  @ApiProperty({ type: 'string', nullable: true, required: false })
  birthDate?: string | null;

  @ApiProperty({ type: 'string', enum: ['MALE', 'FEMALE'], nullable: true, required: false })
  gender?: 'MALE' | 'FEMALE' | null;
}
