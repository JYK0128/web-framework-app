import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class TwoFactorTurnOnRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}
