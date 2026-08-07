import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { SetAgreementsCommand } from './commands';
import { GetAgreementsResponseDto, GetTermsResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto } from './dto';
import { GetAgreementsQuery, GetTermsQuery } from './queries';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Public()
  @Permission('term:read')
  @Get()
  @SwaggerApiResponse(GetTermsResponseDto)
  async getTerms(): Promise<GetTermsResponseDto> {
    return this.queryBus.execute(new GetTermsQuery({}));
  }

  @Permission('term:read')
  @Get('agreements')
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery({}));
  }

  @Permission('term:agree')
  @Post('agree')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(
    @Body() body: SetAgreementsRequestDto,
  ): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(body));
  }
}
