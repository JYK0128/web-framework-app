import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { QnaItemDto } from '#/modules/qna/qna-item.dto';

export class GetQnasResponseDto extends PageResponseDto<QnaItemDto> {
  @ApiProperty({ type: [QnaItemDto] })
  @Type(() => QnaItemDto)
  override items!: QnaItemDto[];
}
