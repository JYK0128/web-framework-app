import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { SupportRoomItemDto } from '#/modules/support/rooms/support-room-item.dto';

export class SupportRoomPageResponseDto extends PageResponseDto<SupportRoomItemDto> { @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[]; }
