import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class IssueEmailChangeChallengeRequestDto {
  @ApiProperty({ type: 'string', example: 'newuser@example.com', description: 'New email address to change to' })
  @IsEmail()
  newEmail!: string;

  @ApiProperty({ type: 'string', example: 'CurrentPassword123!', description: 'Current password for verification', required: false })
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
