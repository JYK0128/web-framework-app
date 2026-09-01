import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ResetUserTwoFactorResponse' })
export class ResetUserTwoFactorResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
