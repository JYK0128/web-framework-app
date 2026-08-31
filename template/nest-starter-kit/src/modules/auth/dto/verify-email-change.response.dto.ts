import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailChangeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string' })
  email!: string;

  @ApiProperty({ type: 'boolean' })
  emailVerified!: boolean;
}
