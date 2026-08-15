import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { UserProfileResponseDto } from '#/modules/auth/dto';

import { CreateTermCommand, CreateTermGroupCommand, DeleteTermCommand, DeleteTermGroupCommand, PublishTermCommand, SetAgreementsCommand, UpdateTermCommand, UpdateTermGroupCommand } from './commands';
import { AdminTermDto, CreateTermGroupRequestDto, CreateTermRequestDto, GetAdminTermGroupsResponseDto, GetAdminTermsRequestDto, GetAdminTermsResponseDto, GetAgreementHistoryResponseDto, GetAgreementsResponseDto, GetTermHistoryCursorRequestDto, GetTermHistoryCursorResponseDto, GetTermHistoryPageRequestDto, GetTermHistoryPageResponseDto, GetTermsResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto, TermGroupItemDto, UpdateTermGroupRequestDto, UpdateTermRequestDto } from './dto';
import { GetAdminTermGroupsQuery, GetAdminTermsQuery, GetAgreementHistoryQuery, GetAgreementsQuery, GetTermHistoryCursorQuery, GetTermHistoryPageQuery, GetTermsQuery } from './queries';

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

  @Permission('term:read')
  @Get('admin/groups')
  @SwaggerApiResponse(GetAdminTermGroupsResponseDto)
  async getAdminTermGroups(): Promise<GetAdminTermGroupsResponseDto> {
    return this.queryBus.execute(new GetAdminTermGroupsQuery());
  }

  @Permission('term:create')
  @Post('admin/groups')
  @SwaggerApiResponse(TermGroupItemDto, HttpStatus.CREATED)
  async createTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<TermGroupItemDto> {
    return this.commandBus.execute(new CreateTermGroupCommand(input));
  }

  @Permission('term:update')
  @Patch('admin/groups/:id')
  @SwaggerApiResponse(TermGroupItemDto)
  async updateTermGroup(
    @Param('id') id: string,
    @Body() input: UpdateTermGroupRequestDto,
  ): Promise<TermGroupItemDto> {
    return this.commandBus.execute(new UpdateTermGroupCommand(id, input));
  }

  @Permission('term:delete')
  @Delete('admin/groups/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TermGroupItemDto)
  async deleteTermGroup(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<TermGroupItemDto> {
    return this.commandBus.execute(new DeleteTermGroupCommand(id, currentUser.id));
  }

  @Permission('term:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminTermsResponseDto)
  async getAdminTerms(@Query() query: GetAdminTermsRequestDto): Promise<GetAdminTermsResponseDto> {
    return this.queryBus.execute(new GetAdminTermsQuery(query));
  }

  @Permission('term:create')
  @Post('admin')
  @SwaggerApiResponse(AdminTermDto, HttpStatus.CREATED)
  async createTerm(@Body() input: CreateTermRequestDto): Promise<AdminTermDto> {
    return this.commandBus.execute(new CreateTermCommand(input));
  }

  @Permission('term:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(AdminTermDto)
  async updateTerm(
    @Param('id') id: string,
    @Body() input: UpdateTermRequestDto,
  ): Promise<AdminTermDto> {
    return this.commandBus.execute(new UpdateTermCommand(id, input));
  }

  @Permission('term:update')
  @Post('admin/:id/publish')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AdminTermDto)
  async publishTerm(@Param('id') id: string): Promise<AdminTermDto> {
    return this.commandBus.execute(new PublishTermCommand(id));
  }

  @Permission('term:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AdminTermDto)
  async deleteTerm(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<AdminTermDto> {
    return this.commandBus.execute(new DeleteTermCommand(id, currentUser.id));
  }

  @Public()
  @Get('history/page')
  @SwaggerApiResponse(GetTermHistoryPageResponseDto)
  async getTermHistoryPage(
    @Query() query: GetTermHistoryPageRequestDto,
  ): Promise<GetTermHistoryPageResponseDto> {
    return this.queryBus.execute(new GetTermHistoryPageQuery(query));
  }

  @Permission('term:read')
  @Bypass(BypassPolicy.TERM)
  @Get('version/history')
  @SwaggerApiResponse(GetTermHistoryCursorResponseDto)
  async getTermHistoryCursor(
    @Query() query: GetTermHistoryCursorRequestDto,
  ): Promise<GetTermHistoryCursorResponseDto> {
    return this.queryBus.execute(new GetTermHistoryCursorQuery(query));
  }

  @Permission('term:read')
  @Bypass(BypassPolicy.TERM)
  @Get('agreements/history')
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery());
  }

  @Permission('term:read')
  @Bypass(BypassPolicy.TERM)
  @Get('agreements')
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery({}));
  }

  @Permission('term:update')
  @Bypass(BypassPolicy.TERM)
  @Post('agree')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(
    @Body() body: SetAgreementsRequestDto,
  ): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(body));
  }
}
