import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteMessageTemplateResponse' })
export class DeleteMessageTemplateResponseDto {
  @ApiProperty({ type: 'boolean', example: true })
  ok!: boolean;
}
