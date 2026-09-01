import { ApiProperty } from '@nestjs/swagger';

export class IssueEmailChallengeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string', format: 'uuid' })
  challengeId!: string;

  @ApiProperty({ type: 'number', description: 'Challenge validity in seconds' })
  expiresIn!: number;
}
