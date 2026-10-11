import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { QnaItemDto } from '#/modules/qna/dto/qna-item.dto';

export class QnaPageResponseDto extends PageResponseDto<QnaItemDto> { @ApiProperty({ type: [QnaItemDto] }) @Type(() => QnaItemDto) override items!: QnaItemDto[]; }
