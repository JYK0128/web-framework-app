import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'UpdateMaintenanceTabResponse' })
export class UpdateMaintenanceTabResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
