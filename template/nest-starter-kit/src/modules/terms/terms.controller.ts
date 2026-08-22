import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

import { CreateTermCommand, CreateTermGroupCommand, DeleteTermCommand, DeleteTermGroupCommand, PublishTermCommand, SetAgreementsCommand, UpdateTermCommand, UpdateTermGroupCommand } from './commands';
import { CreateTermGroupRequestDto, CreateTermGroupResponseDto, CreateTermRequestDto, CreateTermResponseDto, DeleteTermGroupResponseDto, DeleteTermResponseDto, GetAdminTermGroupsResponseDto, GetAdminTermsRequestDto, GetAdminTermsResponseDto, GetAgreementHistoryResponseDto, GetAgreementsResponseDto, GetTermHistoryCursorRequestDto, GetTermHistoryCursorResponseDto, GetTermHistoryPageRequestDto, GetTermHistoryPageResponseDto, GetTermsResponseDto, PublishTermResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto, UpdateTermGroupRequestDto, UpdateTermGroupResponseDto, UpdateTermRequestDto, UpdateTermResponseDto } from './dto';
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

  @Permission('term:manage', 'term:read')
  @Get('admin/groups')
  @SwaggerApiResponse(GetAdminTermGroupsResponseDto)
  async getAdminTermGroups(): Promise<GetAdminTermGroupsResponseDto> {
    return this.queryBus.execute(new GetAdminTermGroupsQuery());
  }

  @Permission('term:manage', 'term:create')
  @Post('admin/groups')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateTermGroupResponseDto, HttpStatus.CREATED)
  async createTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<CreateTermGroupResponseDto> {
    return this.commandBus.execute(new CreateTermGroupCommand(input));
  }

  @Permission('term:manage', 'term:update')
  @Patch('admin/groups/:id')
  @SwaggerApiResponse(UpdateTermGroupResponseDto)
  async updateTermGroup(
    @Param('id') id: string,
    @Body() input: UpdateTermGroupRequestDto,
  ): Promise<UpdateTermGroupResponseDto> {
    return this.commandBus.execute(new UpdateTermGroupCommand({ id, input }));
  }

  @Permission('term:manage', 'term:delete')
  @Delete('admin/groups/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteTermGroupResponseDto)
  async deleteTermGroup(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteTermGroupResponseDto> {
    return this.commandBus.execute(new DeleteTermGroupCommand({ id, currentUserId: currentUser.id }));
  }

  @Permission('term:manage', 'term:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminTermsResponseDto)
  async getAdminTerms(@Query() query: GetAdminTermsRequestDto): Promise<GetAdminTermsResponseDto> {
    return this.queryBus.execute(new GetAdminTermsQuery(query));
  }

  @Permission('term:manage', 'term:create')
  @Post('admin')
  @HttpCode(HttpStatus.CREATED)
  @SwaggerApiResponse(CreateTermResponseDto, HttpStatus.CREATED)
  async createTerm(@Body() input: CreateTermRequestDto): Promise<CreateTermResponseDto> {
    return this.commandBus.execute(new CreateTermCommand(input));
  }

  @Permission('term:manage', 'term:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(UpdateTermResponseDto)
  async updateTerm(
    @Param('id') id: string,
    @Body() input: UpdateTermRequestDto,
  ): Promise<UpdateTermResponseDto> {
    return this.commandBus.execute(new UpdateTermCommand({ id, input }));
  }

  @Permission('term:manage', 'term:update')
  @Post('admin/:id/publish')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(PublishTermResponseDto)
  async publishTerm(@Param('id') id: string): Promise<PublishTermResponseDto> {
    return this.commandBus.execute(new PublishTermCommand({ id }));
  }

  @Permission('term:manage', 'term:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(DeleteTermResponseDto)
  async deleteTerm(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthPrincipal,
  ): Promise<DeleteTermResponseDto> {
    return this.commandBus.execute(new DeleteTermCommand({ id, currentUserId: currentUser.id }));
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
  @Bypass(BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
  @Get('version/history')
  @SwaggerApiResponse(GetTermHistoryCursorResponseDto)
  async getTermHistoryCursor(
    @Query() query: GetTermHistoryCursorRequestDto,
  ): Promise<GetTermHistoryCursorResponseDto> {
    return this.queryBus.execute(new GetTermHistoryCursorQuery(query));
  }

  @Permission('term:read')
  @Bypass(BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
  @Get('agreements/history')
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery());
  }

  @Permission('term:read')
  @Bypass(BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
  @Get('agreements')
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery({}));
  }

  @Permission('term:update')
  @Bypass(BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
  @Post('agree')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(
    @Body() body: SetAgreementsRequestDto,
  ): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(body));
  }
}
