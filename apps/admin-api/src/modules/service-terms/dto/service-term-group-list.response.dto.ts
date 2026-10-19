import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces/response';

import { ServiceTermGroupItemDto } from './service-term-group-item.dto';

export class ServiceTermGroupListResponseDto extends ListResponseDto<ServiceTermGroupItemDto> { @ApiProperty({ type: [ServiceTermGroupItemDto] }) @Type(() => ServiceTermGroupItemDto) override items!: ServiceTermGroupItemDto[]; }
