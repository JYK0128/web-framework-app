import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordResponseDto {
  @ApiProperty({ type: 'string' })
  temporaryPassword!: string;
}
