import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TermsCreateChallengeRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
