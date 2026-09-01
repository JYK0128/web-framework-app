import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'RestoreUserResponse' })
export class RestoreUserResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
