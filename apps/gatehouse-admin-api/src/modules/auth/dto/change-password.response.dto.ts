import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'ChangePasswordResponse' })
export class ChangePasswordResponseDto {
  @ApiProperty()
  ok!: boolean;
}
