import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class IssuePhoneChallengeRequestDto {
  @ApiProperty({ type: 'string', example: '01012345678', description: 'Korean mobile phone number' })
  @IsString()
  @Matches(/^010\d{8}$/)
  phoneNumber!: string;
}
