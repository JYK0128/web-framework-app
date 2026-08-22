import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteAlertResponse' })
export class DeleteAlertResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
