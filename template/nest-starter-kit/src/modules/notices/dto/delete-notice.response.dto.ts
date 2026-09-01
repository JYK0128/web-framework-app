import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'DeleteNoticeResponse' })
export class DeleteNoticeResponseDto {
  @ApiProperty({ type: 'boolean' })
  ok!: boolean;
}
