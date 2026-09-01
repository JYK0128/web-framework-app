import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'MarkAllNoticesReadResponse' })
export class MarkAllNoticesReadResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
