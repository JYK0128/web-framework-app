import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ChangePasswordResponse' })
export class ChangePasswordResponseDto {
  @ApiProperty()
  ok!: boolean;

  @ApiPropertyOptional()
  accessToken?: string;

  @ApiPropertyOptional()
  refreshToken?: string;

  @ApiPropertyOptional({ example: 'Bearer' })
  tokenType?: 'Bearer';
}
