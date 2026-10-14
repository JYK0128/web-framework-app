import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { Permissions } from '@pkg/server-core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';
import { AdminPermission } from '@pkg/shared';

import { GetOperatorByIdQuery } from '#/modules/operators/profile/get-operator-by-id.query';
import { GetOperatorByIdRequestDto } from '#/modules/operators/profile/get-operator-by-id.request.dto';
import { GetOperatorByIdResponseDto } from '#/modules/operators/profile/get-operator-by-id.response.dto';
import { GetOperatorOverviewQuery } from '#/modules/operators/profile/get-operator-overview.query';
import { GetOperatorOverviewRequestDto } from '#/modules/operators/profile/get-operator-overview.request.dto';
import { GetOperatorOverviewResponseDto } from '#/modules/operators/profile/get-operator-overview.response.dto';
import { GetOperatorsQuery } from '#/modules/operators/profile/get-operators.query';
import { GetOperatorsRequestDto } from '#/modules/operators/profile/get-operators.request.dto';
import { GetOperatorsResponseDto } from '#/modules/operators/profile/get-operators.response.dto';

@ApiTags('operators')
@UserAuth()
@Controller('operators')
export class OperatorProfileController {
  constructor(private readonly queryBus: QueryBus) {}

  @Permissions(AdminPermission.operator.read)
  @Get()
  @ApiOperation({ summary: '운영자 목록 조회', operationId: 'OperatorsController_getOperators_v1' })
  @SwaggerApiResponse(GetOperatorsResponseDto)
  async getOperators(@Query() query: GetOperatorsRequestDto): Promise<GetOperatorsResponseDto> {
    return this.queryBus.execute(new GetOperatorsQuery(query));
  }

  @Permissions(AdminPermission.operator.read)
  @Get('overview')
  @ApiOperation({ summary: '운영자 현황 조회', operationId: 'OperatorsController_getOperatorOverview_v1' })
  @SwaggerApiResponse(GetOperatorOverviewResponseDto)
  async getOperatorOverview(): Promise<GetOperatorOverviewResponseDto> {
    return this.queryBus.execute(new GetOperatorOverviewQuery(new GetOperatorOverviewRequestDto()));
  }

  @Permissions(AdminPermission.operator.read)
  @Get(':id')
  @ApiOperation({ summary: '운영자 상세 조회', operationId: 'OperatorsController_getOperatorById_v1' })
  @SwaggerApiResponse(GetOperatorByIdResponseDto)
  async getOperatorById(@Param('id') id: string): Promise<GetOperatorByIdResponseDto> {
    const request = GetOperatorByIdRequestDto.parse({ operatorId: id }).validate();
    return this.queryBus.execute(new GetOperatorByIdQuery(request));
  }
}
