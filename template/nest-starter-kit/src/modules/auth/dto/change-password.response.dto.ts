import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ChangePasswordResponse' })
export class ChangePasswordResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
