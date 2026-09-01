import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'MarkAlertReadResponse' })
export class MarkAlertReadResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
