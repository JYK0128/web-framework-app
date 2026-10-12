import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { GetHolidaysQuery } from './get-holidays.query';
import { GetHolidaysRequestDto } from './get-holidays.request.dto';
import { OperatingHolidayListResponseDto } from './operating-holiday-list.response.dto';

@ApiTags('service-config')
@UserAuth()
@Controller('service-config')
export class ServiceConfigOperationController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get('holidays')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(OperatingHolidayListResponseDto)
  @ApiOperation({ summary: '법정 공휴일 조회', operationId: 'ServiceConfigController_getHolidays_v1' })
  getHolidays(@Query() input: GetHolidaysRequestDto): Promise<OperatingHolidayListResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query: input }));
  }
}
