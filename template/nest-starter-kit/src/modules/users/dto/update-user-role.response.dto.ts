import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateUserRoleResponse' })
export class UpdateUserRoleResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
