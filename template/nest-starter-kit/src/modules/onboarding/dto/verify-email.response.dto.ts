import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'boolean' })
  emailVerified!: boolean;
}
