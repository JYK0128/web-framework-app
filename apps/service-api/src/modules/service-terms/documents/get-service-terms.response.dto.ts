import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { ServiceTermItemDto } from '#/modules/service-terms/documents/service-term-item.dto';

export class GetServiceTermsResponseDto extends PageResponseDto<ServiceTermItemDto> {
  @ApiProperty({ type: [ServiceTermItemDto] })
  @Type(() => ServiceTermItemDto)
  items!: ServiceTermItemDto[];
}
