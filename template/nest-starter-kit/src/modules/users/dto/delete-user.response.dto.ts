import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteUserResponse' })
export class DeleteUserResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
