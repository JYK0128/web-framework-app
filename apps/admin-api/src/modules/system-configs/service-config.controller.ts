import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { UserAuth } from '#/common/decorators/auth-mode.decorator';
import { Permissions } from '#/common/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { UpdateSystemConfigCommand } from './commands';
import { GetHolidaysRequestDto } from './dto/get-holidays.request.dto';
import { OperatingHolidayListResponseDto } from './dto/operating-holiday-list.response.dto';
import { GetHolidaysQuery, GetSystemConfigQuery } from './queries';
import { ServiceConfigResponseDto, UpdateServiceConfigRequestDto, UpdateSystemConfigResponseDto } from './system-config.interfaces';

@ApiTags('service-config')
@UserAuth()
@Controller()
export class ServiceConfigController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get('service-config')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(ServiceConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 조회' })
  async getConfigs(): Promise<ServiceConfigResponseDto> {
    const config = await this.queryBus.execute(new GetSystemConfigQuery());
    return { operation: config.operation, maintenance: config.maintenance, inquiry: config.inquiry };
  }

  @Get('service-config/holidays')
  @Permissions(AdminPermission.system.read)
  @SwaggerApiResponse(OperatingHolidayListResponseDto)
  @ApiOperation({ summary: '법정 공휴일 조회' })
  getHolidays(@Query() input: GetHolidaysRequestDto): Promise<OperatingHolidayListResponseDto> {
    return this.queryBus.execute(new GetHolidaysQuery({ query: input }));
  }

  @Patch('service-config')
  @Permissions(AdminPermission.system.update)
  @SwaggerApiResponse(UpdateSystemConfigResponseDto)
  @ApiOperation({ summary: '서비스 설정 전체 수정' })
  updateConfigs(@Body() input: UpdateServiceConfigRequestDto): Promise<UpdateSystemConfigResponseDto> {
    return this.commandBus.execute(new UpdateSystemConfigCommand(input));
  }
}
