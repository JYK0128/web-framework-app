import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrincipalContext } from '@pkg/server-core/http/contexts/principal.context';
import { SkipPasswordExpiry, UserAuth } from '@pkg/server-core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '@pkg/server-core/http/decorators/swagger-api-response.decorator';

import { GetServiceAgreementHistoryQuery } from '#/modules/service-terms/agreements/get-service-agreement-history.query';
import { GetServiceAgreementHistoryRequestDto } from '#/modules/service-terms/agreements/get-service-agreement-history.request.dto';
import { GetServiceAgreementHistoryResponseDto } from '#/modules/service-terms/agreements/get-service-agreement-history.response.dto';
import { GetServiceTermAgreementsQuery } from '#/modules/service-terms/agreements/get-service-term-agreements.query';
import { GetServiceTermAgreementsRequestDto } from '#/modules/service-terms/agreements/get-service-term-agreements.request.dto';
import { GetServiceTermAgreementsResponseDto } from '#/modules/service-terms/agreements/get-service-term-agreements.response.dto';
import { SetServiceTermAgreementsCommand } from '#/modules/service-terms/agreements/set-service-term-agreements.command';
import { SetServiceTermAgreementsRequestDto } from '#/modules/service-terms/agreements/set-service-term-agreements.request.dto';
import { SetServiceTermAgreementsResponseDto } from '#/modules/service-terms/agreements/set-service-term-agreements.response.dto';

@ApiTags('service-terms')
@Controller('service-terms')
export class ServiceTermAgreementsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus, private readonly principalContext: PrincipalContext) {}

  @SkipPasswordExpiry()
  @UserAuth() @ApiOperation({ operationId: 'ServiceTermsController_getAgreements_v1', summary: '현재 사용자의 서비스 약관 동의 상태 조회' }) @SwaggerApiResponse(GetServiceTermAgreementsResponseDto) @Get('agreements')
  getAgreements(_input: GetServiceTermAgreementsRequestDto = new GetServiceTermAgreementsRequestDto()): Promise<GetServiceTermAgreementsResponseDto> {
    return this.queryBus.execute(new GetServiceTermAgreementsQuery({ userId: this.principalContext.ensureUser().id }));
  }

  @SkipPasswordExpiry()
  @UserAuth() @ApiOperation({ operationId: 'ServiceTermsController_setAgreements_v1', summary: '서비스 약관 동의 상태 저장' }) @HttpCode(HttpStatus.OK) @SwaggerApiResponse(SetServiceTermAgreementsResponseDto) @Post('agreements')
  setAgreements(@Body() dto: SetServiceTermAgreementsRequestDto): Promise<SetServiceTermAgreementsResponseDto> { return this.commandBus.execute(new SetServiceTermAgreementsCommand({ userId: this.principalContext.ensureUser().id, dto })); }

  @UserAuth() @ApiOperation({ operationId: 'ServiceTermsController_getAgreementHistory_v1', summary: '현재 사용자의 약관별 동의 이력 조회' }) @SwaggerApiResponse(GetServiceAgreementHistoryResponseDto) @Get('agreement-history')
  getAgreementHistory(@Query() dto: GetServiceAgreementHistoryRequestDto): Promise<GetServiceAgreementHistoryResponseDto> { return this.queryBus.execute(new GetServiceAgreementHistoryQuery({ userId: this.principalContext.ensureUser().id, dto })); }
}
