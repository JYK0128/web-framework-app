import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorVerifyChallengeRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}
