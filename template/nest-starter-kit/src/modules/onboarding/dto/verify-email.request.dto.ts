import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ type: 'string', format: 'uuid' })
  @IsString()
  @IsUUID()
  challengeId!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(512)
  code!: string;
}
