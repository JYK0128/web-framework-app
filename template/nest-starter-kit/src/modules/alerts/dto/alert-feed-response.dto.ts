import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { AlertItemDto } from './alert-item.dto';

export class AlertFeedResponseDto extends ListResponseDto<AlertItemDto> {
  @ApiProperty({ type: () => [AlertItemDto] })
  override items!: AlertItemDto[];

  @ApiProperty({ type: 'number' })
  total!: number;

  @ApiProperty({ type: 'number' })
  unreadCount!: number;
}
