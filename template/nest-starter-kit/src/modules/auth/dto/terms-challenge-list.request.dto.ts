import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TermsChallengeListRequestDto {
  @ApiProperty({ description: 'Challenge token' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
