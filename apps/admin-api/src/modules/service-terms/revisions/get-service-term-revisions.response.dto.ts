import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { ServiceTermRevisionItemDto } from '#/modules/service-terms/revisions/service-term-revision-item.dto';

export class GetServiceTermRevisionsResponseDto extends PageResponseDto<ServiceTermRevisionItemDto> {
  @ApiProperty({ type: [ServiceTermRevisionItemDto] })
  @Type(() => ServiceTermRevisionItemDto)
  override items!: ServiceTermRevisionItemDto[];
}
