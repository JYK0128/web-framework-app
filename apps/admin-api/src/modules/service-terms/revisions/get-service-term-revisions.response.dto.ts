import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';

import { ServiceTermRevisionItemDto } from './service-term-revision-item.dto';

export class GetServiceTermRevisionsResponseDto extends PageResponseDto<ServiceTermRevisionItemDto> {
  @ApiProperty({ type: [ServiceTermRevisionItemDto] })
  @Type(() => ServiceTermRevisionItemDto)
  override items!: ServiceTermRevisionItemDto[];
}
