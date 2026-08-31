import { ApiProperty } from '@nestjs/swagger';

export class IssuePhoneChallengeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string', format: 'uuid' })
  challengeId!: string;

  @ApiProperty({ type: 'number', description: 'Challenge validity in seconds' })
  expiresIn!: number;

  @ApiProperty({ type: 'string', description: 'Temporary mock verification code' })
  mockCode!: string;
}
