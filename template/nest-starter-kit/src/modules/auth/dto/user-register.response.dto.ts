import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserRegisterResponseDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiPropertyOptional()
  termsRedirect?: boolean;
}
