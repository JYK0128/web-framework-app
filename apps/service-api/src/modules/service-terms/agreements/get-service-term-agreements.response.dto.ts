import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { ServiceTermAgreementItemDto } from '#/modules/service-terms/agreements/service-term-agreement-item.dto';

export class GetServiceTermAgreementsResponseDto extends ListResponseDto<ServiceTermAgreementItemDto> {
  @ApiProperty({ type: [ServiceTermAgreementItemDto] })
  @Type(() => ServiceTermAgreementItemDto)
  items!: ServiceTermAgreementItemDto[];
}
