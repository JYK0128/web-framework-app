import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { SupportTicketItemDto } from './support-ticket-item.dto';

export class GetSupportTicketsResponseDto extends PageResponseDto<SupportTicketItemDto> {
  @ApiProperty({ type: () => [SupportTicketItemDto] })
  @Type(() => SupportTicketItemDto)
  override items!: SupportTicketItemDto[];
}
