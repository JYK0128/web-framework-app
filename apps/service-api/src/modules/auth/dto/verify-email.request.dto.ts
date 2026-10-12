import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  challengeId!: string;

  @ApiProperty({ type: String })
  @IsString()
  @IsNotEmpty()
  token!: string;
}
