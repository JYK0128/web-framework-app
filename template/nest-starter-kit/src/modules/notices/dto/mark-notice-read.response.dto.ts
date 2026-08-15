import { ApiProperty } from '@nestjs/swagger';

export class MarkNoticeReadResponseDto {
  @ApiProperty({ type: Boolean })
  isRead!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  readAt!: Date;
}
