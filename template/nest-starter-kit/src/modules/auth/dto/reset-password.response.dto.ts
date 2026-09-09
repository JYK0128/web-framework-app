import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ResetPasswordResponse' })
export class ResetPasswordResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
