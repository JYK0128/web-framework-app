import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { SupportMessageItemDto } from '#/modules/support/messages/support-message-item.dto';

export class SupportMessageListResponseDto extends ListResponseDto<SupportMessageItemDto> { @ApiProperty({ type: [SupportMessageItemDto] }) @Type(() => SupportMessageItemDto) override items!: SupportMessageItemDto[]; }
