import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({ example: 'Aa1!temporary-password' })
  temporaryPassword!: string;
}
