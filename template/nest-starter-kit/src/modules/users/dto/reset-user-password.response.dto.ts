import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ResetPasswordResponseDto' })
export class ResetUserPasswordResponseDto {
  @ApiProperty({ type: 'string' })
  temporaryPassword!: string;
}
