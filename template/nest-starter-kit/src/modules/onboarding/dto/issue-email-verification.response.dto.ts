import { ApiProperty } from '@nestjs/swagger';

export class IssueEmailVerificationResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 300, description: '인증 코드 유효 시간 (초)' })
  expiresIn!: number;
}
