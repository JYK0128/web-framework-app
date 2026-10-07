import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'IssueEmailChallengeResponseDto' })
export class IssueEmailChallengePublicResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string', format: 'uuid' })
  challengeId!: string;

  @ApiProperty({ type: 'number', description: 'Challenge validity in seconds' })
  expiresIn!: number;
}
