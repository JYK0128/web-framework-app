import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(512)
  code!: string;
}
