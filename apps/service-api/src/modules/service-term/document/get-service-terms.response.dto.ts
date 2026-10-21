import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { ServiceTermItemDto } from '~/modules/service-term/document/service-term-item.dto';

export class GetServiceTermsResponseDto extends PageResponseDto<ServiceTermItemDto> {
  @ApiProperty({ type: [ServiceTermItemDto] })
  @Type(() => ServiceTermItemDto)
  items!: ServiceTermItemDto[];
}
