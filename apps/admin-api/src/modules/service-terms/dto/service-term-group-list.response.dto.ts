import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { ServiceTermGroupItemDto } from '#/modules/service-terms/dto/service-term-group-item.dto';

export class ServiceTermGroupListResponseDto extends ListResponseDto<ServiceTermGroupItemDto> { @ApiProperty({ type: [ServiceTermGroupItemDto] }) @Type(() => ServiceTermGroupItemDto) override items!: ServiceTermGroupItemDto[]; }
