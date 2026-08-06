import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

import { ApiOkResponseData } from '#/common/decorators/api-ok-response-data.decorator';
import { Public } from '#/common/decorators/public.decorator';

import { UpdateAgreementsCommand } from './commands';
import { GetAgreementsResponseDto, GetTermsResponseDto, UpdateAgreementsRequestDto, UpdateAgreementsResponseDto } from './dto';
import { GetAgreementsQuery, GetTermsQuery } from './queries';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Get()
  @ApiOkResponseData(GetTermsResponseDto)
  async getTerms(): Promise<GetTermsResponseDto> {
    return this.queryBus.execute(new GetTermsQuery({}));
  }

  @Get('agreements')
  @ApiCookieAuth('auth_session')
  @ApiOkResponseData(GetAgreementsResponseDto)
  async getAgreements(): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery({}));
  }

  @Post('agree')
  @ApiCookieAuth('auth_session')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(UpdateAgreementsResponseDto)
  async updateAgreements(
    @Body() body: UpdateAgreementsRequestDto,
  ): Promise<UpdateAgreementsResponseDto> {
    return this.commandBus.execute(new UpdateAgreementsCommand(body));
  }
}
