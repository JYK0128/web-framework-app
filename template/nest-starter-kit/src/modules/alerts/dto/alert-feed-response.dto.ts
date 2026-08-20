import { ApiProperty } from '@nestjs/swagger';

import { AlertItemDto } from './alert-item.dto';

export class AlertFeedResponseDto {
  constructor(items: AlertItemDto[], total: number, unreadCount: number) {
    this.items = items;
    this.total = total;
    this.unreadCount = unreadCount;
  }

  @ApiProperty({ type: () => [AlertItemDto] })
  items!: AlertItemDto[];

  @ApiProperty({ type: 'number' })
  total!: number;

  @ApiProperty({ type: 'number' })
  unreadCount!: number;
}
