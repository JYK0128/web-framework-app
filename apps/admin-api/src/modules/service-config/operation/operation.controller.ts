import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { AdminPermission } from '@pkg/shared';

import { GetHolidaysQuery } from '~/modules/service-config/operation/get-holidays.query';
import { GetHolidaysRequestDto } from '~/modules/service-config/operation/get-holidays.request.dto';
import { GetHolidaysResponseDto } from '~/modules/service-config/operation/get-holidays.response.dto';

@ApiTags('service-config')
@UserAuth()
@Controller('service-config')
export class ServiceConfigOperationController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('holidays')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(GetHolidaysResponseDto)
  @ApiOperation({ summary: '법정 공휴일 조회', operationId: 'ServiceConfigController_getHolidays_v1' })
  getHolidays(@Query() input: GetHolidaysRequestDto): Promise<GetHolidaysResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query: input }));
  }
}
