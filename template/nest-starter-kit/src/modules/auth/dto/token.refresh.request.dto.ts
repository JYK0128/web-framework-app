import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class TokenRefreshRequestDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
