import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteFaqResponse' })
export class DeleteFaqResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
