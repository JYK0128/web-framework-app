import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';

export class GetTermRevisionsRequestDto extends PickType(PageRequestDto, ['page', 'limit'] as const) {}

@ApiSchema({ name: 'TermRevisionItem' })
export class TermRevisionItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() version!: string;
  @ApiProperty({ format: 'date-time' }) publishedAt!: Date;
  @ApiProperty() reason!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() content!: string;
}

export class TermRevisionPageResponseDto extends PageResponseDto<TermRevisionItemDto> {
  @ApiProperty({ type: [TermRevisionItemDto] }) @Type(() => TermRevisionItemDto) override items!: TermRevisionItemDto[];
}
