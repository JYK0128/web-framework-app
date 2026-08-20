import { ApiProperty } from '@nestjs/swagger';

export class IssueEmailVerificationResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'number' })
  expiresIn!: number;
}
