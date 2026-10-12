import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { NoticeItemDto } from '#/modules/notices/notice-item.dto';

export class NoticePageResponseDto extends PageResponseDto<NoticeItemDto> { @ApiProperty({ type: [NoticeItemDto] }) @Type(() => NoticeItemDto) items!: NoticeItemDto[]; }
