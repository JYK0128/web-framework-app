import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: true })
  emailVerified!: boolean;
}
