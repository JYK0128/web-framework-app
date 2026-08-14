import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { SetAgreementsCommand } from './commands';
import { GetAgreementHistoryResponseDto, GetAgreementsResponseDto, GetTermHistoryCursorRequestDto, GetTermHistoryCursorResponseDto, GetTermHistoryPageRequestDto, GetTermHistoryPageResponseDto, GetTermsResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto } from './dto';
import { GetAgreementHistoryQuery, GetAgreementsQuery, GetTermHistoryCursorQuery, GetTermHistoryPageQuery, GetTermsQuery } from './queries';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Get()
  @SwaggerApiResponse(GetTermsResponseDto)
  async getTerms(): Promise<GetTermsResponseDto> {
    return this.queryBus.execute(new GetTermsQuery({}));
  }

  @Public()
  @Permission('term:read')
  @Get('history/page')
  @SwaggerApiResponse(GetTermHistoryPageResponseDto)
  async getTermHistoryPage(
    @Query() query: GetTermHistoryPageRequestDto,
  ): Promise<GetTermHistoryPageResponseDto> {
    return this.queryBus.execute(new GetTermHistoryPageQuery(query));
  }

  @Permission('term:read')
  @Get('version/history')
  @SwaggerApiResponse(GetTermHistoryCursorResponseDto)
  async getTermHistoryCursor(
    @Query() query: GetTermHistoryCursorRequestDto,
  ): Promise<GetTermHistoryCursorResponseDto> {
    return this.queryBus.execute(new GetTermHistoryCursorQuery(query));
  }

  @Permission('term:read')
  @Get('agreements/history')
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery());
  }

  @Permission('term:read')
  @Get('agreements')
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery({}));
  }

  @Permission('term:update')
  @Post('agree')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(
    @Body() body: SetAgreementsRequestDto,
  ): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(body));
  }
}
