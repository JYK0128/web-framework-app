import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class IssuePhoneChangeChallengeRequestDto {
  @ApiProperty({ type: 'string', example: '01012345678', description: 'New Korean mobile phone number' })
  @IsString()
  @Matches(/^010\d{8}$/)
  phoneNumber!: string;
}
