import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateOperationsTabResponse' })
export class UpdateOperationsTabResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
