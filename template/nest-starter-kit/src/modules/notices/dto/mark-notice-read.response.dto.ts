import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'MarkNoticeReadResponse' })
export class MarkNoticeReadResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
