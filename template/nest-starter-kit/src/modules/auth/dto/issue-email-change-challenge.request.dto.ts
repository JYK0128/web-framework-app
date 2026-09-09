import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { User } from '#/entities/auth/user.entity';

export class IssueEmailChangeChallengeRequestDto extends EntityDto(User) {
  @ApiProperty({ type: 'string', example: 'newuser@example.com', description: 'New email address to change to' })
  @IsEmail()
  newEmail!: string;

  @ApiProperty({ type: 'string', example: 'CurrentPassword123!', description: 'Current password for verification', required: false })
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
