import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class VerifyEmailChangeRequestDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsString()
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ type: 'string', description: 'Magic link verification token' })
  @IsString()
  @MinLength(1)
  token!: string;
}
