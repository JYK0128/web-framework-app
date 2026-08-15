import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { isValid } from 'date-fns';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Permission } from '#/common/decorators/permission.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AppEntityManager } from '#/database/entity-manager';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';
import { UserProfileResponseDto } from '#/modules/auth/dto';

import { SetAgreementsCommand } from './commands';
import { AdminTermDto, CreateTermGroupRequestDto, CreateTermRequestDto, GetAdminTermGroupsResponseDto, GetAdminTermsRequestDto, GetAdminTermsResponseDto, GetAgreementHistoryResponseDto, GetAgreementsResponseDto, GetTermHistoryCursorRequestDto, GetTermHistoryCursorResponseDto, GetTermHistoryPageRequestDto, GetTermHistoryPageResponseDto, GetTermsResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto, TermGroupItemDto, UpdateTermGroupRequestDto, UpdateTermRequestDto } from './dto';
import { GetAgreementHistoryQuery, GetAgreementsQuery, GetTermHistoryCursorQuery, GetTermHistoryPageQuery, GetTermsQuery } from './queries';

@ApiTags('terms')
@Controller('terms')
export class TermsController {
  constructor(
    private readonly em: AppEntityManager,
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
    const groups = await this.em.find(TermGroup, {}, { orderBy: { sortOrder: 'ASC', createdAt: 'ASC' } });
    return { groups: groups.map((group) => new TermGroupItemDto(group)) };
  }

  @Permission('term:create')
  @Post('admin/groups')
  @SwaggerApiResponse(TermGroupItemDto, HttpStatus.CREATED)
  async createTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<TermGroupItemDto> {
    const code = input.code.trim();
    const duplicate = await this.em.findOne(TermGroup, { code }, { filters: false });
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_GROUP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }

    const group = this.em.create(TermGroup, {
      code,
      title: input.title.trim(),
      isRequired: input.isRequired ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    this.em.persist(group);

    return new TermGroupItemDto(group);
  }

  @Permission('term:update')
  @Patch('admin/groups/:id')
  @SwaggerApiResponse(TermGroupItemDto)
  async updateTermGroup(
    @Param('id') id: string,
    @Body() input: UpdateTermGroupRequestDto,
  ): Promise<TermGroupItemDto> {
    const group = await this.requireTermGroup(id);
    const code = input.code?.trim() ?? group.code;
    const duplicate = await this.em.findOne(TermGroup, { code, id: { $ne: group.id } }, { filters: false });
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_GROUP_CODE_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }

    group.code = code;
    if (input.title !== undefined) group.title = input.title.trim();
    if (input.isRequired !== undefined) group.isRequired = input.isRequired;
    if (input.sortOrder !== undefined) group.sortOrder = input.sortOrder;

    return new TermGroupItemDto(group);
  }

  @Permission('term:delete')
  @Delete('admin/groups/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(TermGroupItemDto)
  async deleteTermGroup(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<TermGroupItemDto> {
    const group = await this.requireTermGroup(id);
    const termCount = await this.em.count(Term, { termGroup: group.id }, { filters: false });
    if (termCount > 0) {
      throw new ApplicationError({ code: 'TERM_GROUP_HAS_TERMS', status: HttpStatus.CONFLICT });
    }

    group.deletedAt = new Date();
    group.deletedBy = currentUser.id;

    return new TermGroupItemDto(group);
  }

  @Permission('term:read')
  @Get('admin')
  @SwaggerApiResponse(GetAdminTermsResponseDto)
  async getAdminTerms(@Query() query: GetAdminTermsRequestDto): Promise<GetAdminTermsResponseDto> {
    const pageResult = await this.em.findByPage(Term, query.toFilterQuery(), {
      ...query.toPageOptions(),
      populate: ['termGroup'],
    });

    return {
      ...pageResult,
      items: pageResult.items.map((term) => new AdminTermDto(term)),
    };
  }

  @Permission('term:create')
  @Post('admin')
  @SwaggerApiResponse(AdminTermDto, HttpStatus.CREATED)
  async createTerm(@Body() input: CreateTermRequestDto): Promise<AdminTermDto> {
    const group = await this.requireTermGroup(input.termGroupId);
    const duplicate = await this.em.findOne(Term, { termGroup: group.id, version: input.version.trim() });
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }

    const term = this.em.create(Term, {
      termGroup: group,
      version: input.version.trim(),
      content: input.content.trim(),
      publishedAt: this.parsePublishedAt(input.publishedAt),
    });
    this.em.persist(term);

    return new AdminTermDto(term);
  }

  @Permission('term:update')
  @Patch('admin/:id')
  @SwaggerApiResponse(AdminTermDto)
  async updateTerm(
    @Param('id') id: string,
    @Body() input: UpdateTermRequestDto,
  ): Promise<AdminTermDto> {
    const term = await this.requireTerm(id);
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_MODIFIED', status: HttpStatus.CONFLICT });
    }

    const version = input.version?.trim() ?? term.version;
    const duplicate = await this.em.findOne(Term, {
      termGroup: term.termGroup,
      version,
      id: { $ne: term.id },
    });
    if (duplicate) {
      throw new ApplicationError({ code: 'TERM_VERSION_ALREADY_EXISTS', status: HttpStatus.CONFLICT });
    }

    term.version = version;
    if (input.content !== undefined) term.content = input.content.trim();
    if (input.publishedAt !== undefined) term.publishedAt = this.parsePublishedAt(input.publishedAt);

    return new AdminTermDto(term);
  }

  @Permission('term:update')
  @Post('admin/:id/publish')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AdminTermDto)
  async publishTerm(@Param('id') id: string): Promise<AdminTermDto> {
    const term = await this.requireTerm(id);
    term.publishedAt = new Date();

    return new AdminTermDto(term);
  }

  @Permission('term:delete')
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(AdminTermDto)
  async deleteTerm(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserProfileResponseDto,
  ): Promise<AdminTermDto> {
    const term = await this.requireTerm(id);
    if (term.isPublished) {
      throw new ApplicationError({ code: 'PUBLISHED_TERM_CANNOT_BE_DELETED', status: HttpStatus.CONFLICT });
    }

    term.deletedAt = new Date();
    term.deletedBy = currentUser.id;

    return new AdminTermDto(term);
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

  private async requireTerm(id: string): Promise<Term> {
    const term = await this.em.findOne(Term, { id }, { populate: ['termGroup'], filters: false });
    if (!term || term.deletedAt) {
      throw new ApplicationError({ code: 'TERM_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return term;
  }

  private async requireTermGroup(id: string): Promise<TermGroup> {
    const group = await this.em.findOne(TermGroup, { id }, { filters: false });
    if (!group || group.deletedAt) {
      throw new ApplicationError({ code: 'TERM_GROUP_NOT_FOUND', status: HttpStatus.NOT_FOUND });
    }

    return group;
  }

  private parsePublishedAt(value: Date | null | undefined): Date | null {
    if (value === undefined || value === null) return null;
    if (!isValid(value)) {
      throw new ApplicationError({ code: 'INVALID_PUBLISHED_AT', status: HttpStatus.BAD_REQUEST });
    }
    return value;
  }
}
