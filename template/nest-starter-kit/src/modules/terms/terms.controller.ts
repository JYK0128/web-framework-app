import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '#/common/decorators/public.decorator';

import { AgreeOptionalTermCommand, WithdrawOptionalTermCommand } from './commands';
import { AgreeOptionalTermResponseDto, GetMyAgreementsResponseDto, GetPublishedTermsResponseDto, WithdrawOptionalTermResponseDto } from './dto';
import { GetMyAgreementsQuery, GetPublishedTermsQuery } from './queries';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Get('published')
  @ApiOkResponse({ type: GetPublishedTermsResponseDto })
  async getPublishedTerms(): Promise<GetPublishedTermsResponseDto> {
    return this.queryBus.execute(new GetPublishedTermsQuery({}));
  }

  @Get('my-agreements')
  @ApiCookieAuth('auth_session')
  @ApiOkResponse({ type: GetMyAgreementsResponseDto })
  async getMyAgreements(): Promise<GetMyAgreementsResponseDto> {
    return this.queryBus.execute(new GetMyAgreementsQuery({}));
  }

  @Post(':termGroupId/agree')
  @ApiCookieAuth('auth_session')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AgreeOptionalTermResponseDto })
  async agreeOptionalTerm(
    @Param('termGroupId') termGroupId: string,
  ): Promise<AgreeOptionalTermResponseDto> {
    return this.commandBus.execute(new AgreeOptionalTermCommand({ termGroupId }));
  }

  @Delete(':termGroupId/withdraw')
  @ApiCookieAuth('auth_session')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: WithdrawOptionalTermResponseDto })
  async withdrawOptionalTerm(
    @Param('termGroupId') termGroupId: string,
  ): Promise<WithdrawOptionalTermResponseDto> {
    return this.commandBus.execute(new WithdrawOptionalTermCommand({ termGroupId }));
  }
}
