import { ApiProperty } from '@nestjs/swagger';

export class IssueEmailChangeChallengeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;

  @ApiProperty({ type: 'string', format: 'uuid' })
  challengeId!: string;

  @ApiProperty({ type: 'number', description: 'Expiration in seconds' })
  expiresIn!: number;

  @ApiProperty({ type: 'string' })
  newEmail!: string;

  @ApiProperty({ type: 'string', required: false, nullable: true, description: 'Direct verification link for development environment' })
  devMagicLink?: string;
}
