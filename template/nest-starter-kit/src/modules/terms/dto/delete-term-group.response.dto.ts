import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteTermGroupResponse' })
export class DeleteTermGroupResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
