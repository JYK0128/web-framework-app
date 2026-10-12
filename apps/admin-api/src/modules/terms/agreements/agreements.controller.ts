import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { SkipPasswordExpiry, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';

import { GetAgreementHistoryQuery } from './get-agreement-history.query';
import { GetAgreementHistoryRequestDto } from './get-agreement-history.request.dto';
import { GetAgreementHistoryResponseDto } from './get-agreement-history.response.dto';
import { GetAgreementsQuery } from './get-agreements.query';
import { GetAgreementsRequestDto } from './get-agreements.request.dto';
import { GetAgreementsResponseDto } from './get-agreements.response.dto';
import { SetAgreementsCommand } from './set-agreements.command';
import { SetAgreementsRequestDto } from './set-agreements.request.dto';
import { SetAgreementsResponseDto } from './set-agreements.response.dto';

@ApiTags('terms')
@UserAuth()
@Controller('terms')
export class TermAgreementsController {
  constructor(private readonly queryBus: QueryBus, private readonly commandBus: CommandBus) {}

  @SkipPasswordExpiry()
  @Get('agreements')
  @ApiOperation({ summary: '약관 동의 목록 조회', operationId: 'TermsController_getAgreements_v1' })
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(@Query() query: GetAgreementsRequestDto): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery(query));
  }

  @Get('agreements/history')
  @ApiOperation({ summary: '약관 동의 이력 조회', operationId: 'TermsController_getAgreementHistory_v1' })
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(@Query() query: GetAgreementHistoryRequestDto): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery(query));
  }

  @SkipPasswordExpiry()
  @Post('agreements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 동의 저장', operationId: 'TermsController_setAgreements_v1' })
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(@Body() input: SetAgreementsRequestDto): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(input));
  }
}
