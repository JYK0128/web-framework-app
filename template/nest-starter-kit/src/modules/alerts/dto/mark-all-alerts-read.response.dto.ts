import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'MarkAllAlertsReadResponse' })
export class MarkAllAlertsReadResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
