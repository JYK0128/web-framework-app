import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class Create2FAChallengeRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
