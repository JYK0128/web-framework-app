import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteTermResponse' })
export class DeleteTermResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
