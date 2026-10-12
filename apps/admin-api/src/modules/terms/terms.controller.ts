import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminPermission } from '@pkg/shared';

import { SkipPasswordExpiry, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { Permissions } from '#/core/http/decorators/permission.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { CreateTermGroupRequestDto, CreateTermGroupResponseDto, CreateTermRequestDto, CreateTermResponseDto, DeleteTermGroupRequestDto, DeleteTermGroupResponseDto, DeleteTermRequestDto, DeleteTermResponseDto, GetAgreementHistoryRequestDto, GetAgreementHistoryResponseDto, GetAgreementsRequestDto, GetAgreementsResponseDto, GetTermGroupsRequestDto, GetTermGroupsResponseDto, GetTermRequestDto, GetTermResponseDto, GetTermRevisionsRequestDto, GetTermRevisionsResponseDto, GetTermsRequestDto, GetTermsResponseDto, PublishTermRequestDto, PublishTermResponseDto, SetAgreementsRequestDto, SetAgreementsResponseDto, UpdateTermGroupRequestDto, UpdateTermGroupResponseDto, UpdateTermRequestDto, UpdateTermResponseDto } from '#/modules/terms';
import { GetAgreementHistoryQuery } from '#/modules/terms/agreements/get-agreement-history.query';
import { GetAgreementsQuery } from '#/modules/terms/agreements/get-agreements.query';
import { SetAgreementsCommand } from '#/modules/terms/agreements/set-agreements.command';
import { CreateTermCommand } from '#/modules/terms/documents/create-term.command';
import { DeleteTermCommand } from '#/modules/terms/documents/delete-term.command';
import { GetTermQuery } from '#/modules/terms/documents/get-term.query';
import { GetTermsQuery } from '#/modules/terms/documents/get-terms.query';
import { PublishTermCommand } from '#/modules/terms/documents/publish-term.command';
import { UpdateTermCommand } from '#/modules/terms/documents/update-term.command';
import { CreateTermGroupCommand } from '#/modules/terms/groups/create-term-group.command';
import { DeleteTermGroupCommand } from '#/modules/terms/groups/delete-term-group.command';
import { GetTermGroupsQuery } from '#/modules/terms/groups/get-term-groups.query';
import { UpdateTermGroupCommand } from '#/modules/terms/groups/update-term-group.command';
import { GetTermRevisionsQuery } from '#/modules/terms/revisions/get-term-revisions.query';

@ApiTags('terms')
@UserAuth()
@Controller('terms')
export class TermsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('groups/:groupId/revisions')
  @ApiOperation({ summary: '게시된 약관 개정 이력 조회' })
  @SwaggerApiResponse(GetTermRevisionsResponseDto)
  getRevisions(@Param('groupId') groupId: string, @Query() dto: GetTermRevisionsRequestDto): Promise<GetTermRevisionsResponseDto> {
    return this.queryBus.execute(new GetTermRevisionsQuery({ groupId, dto }));
  }

  @SkipPasswordExpiry()
  @Get('agreements')
  @ApiOperation({ summary: '약관 동의 목록 조회' })
  @SwaggerApiResponse(GetAgreementsResponseDto)
  async getAgreements(@Query() query: GetAgreementsRequestDto): Promise<GetAgreementsResponseDto> {
    return this.queryBus.execute(new GetAgreementsQuery(query));
  }

  @Get('agreements/history')
  @ApiOperation({ summary: '약관 동의 이력 조회' })
  @SwaggerApiResponse(GetAgreementHistoryResponseDto)
  async getAgreementHistory(@Query() query: GetAgreementHistoryRequestDto): Promise<GetAgreementHistoryResponseDto> {
    return this.queryBus.execute(new GetAgreementHistoryQuery(query));
  }

  @Get()
  @Permissions(AdminPermission.terms.read)
  @ApiOperation({ summary: '약관 목록 조회' })
  @SwaggerApiResponse(GetTermsResponseDto)
  async getTerms(@Query() query: GetTermsRequestDto): Promise<GetTermsResponseDto> {
    return this.queryBus.execute(new GetTermsQuery(query));
  }

  @Get('groups')
  @Permissions(AdminPermission.terms.read)
  @ApiOperation({ summary: '약관 그룹 목록 조회' })
  @SwaggerApiResponse(GetTermGroupsResponseDto)
  async getTermGroups(@Query() input: GetTermGroupsRequestDto): Promise<GetTermGroupsResponseDto> {
    return this.queryBus.execute(new GetTermGroupsQuery(input));
  }

  @Post('groups')
  @Permissions(AdminPermission.terms.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '약관 그룹 생성' })
  @SwaggerApiResponse(CreateTermGroupResponseDto, HttpStatus.CREATED)
  async createTermGroup(@Body() input: CreateTermGroupRequestDto): Promise<CreateTermGroupResponseDto> {
    return this.commandBus.execute(new CreateTermGroupCommand(input));
  }

  @Patch('groups/:id')
  @Permissions(AdminPermission.terms.update)
  @ApiOperation({ summary: '약관 그룹 수정' })
  @SwaggerApiResponse(UpdateTermGroupResponseDto)
  async updateTermGroup(@Param('id') id: string, @Body() input: UpdateTermGroupRequestDto): Promise<UpdateTermGroupResponseDto> {
    return this.commandBus.execute(new UpdateTermGroupCommand({ groupId: id, data: input }));
  }

  @Delete('groups/:id')
  @Permissions(AdminPermission.terms.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 그룹 삭제' })
  @SwaggerApiResponse(DeleteTermGroupResponseDto)
  async deleteTermGroup(@Param('id') id: string): Promise<DeleteTermGroupResponseDto> {
    return this.commandBus.execute(new DeleteTermGroupCommand(DeleteTermGroupRequestDto.parse({ groupId: id }).validate()));
  }

  @Post()
  @Permissions(AdminPermission.terms.create)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '약관 생성' })
  @SwaggerApiResponse(CreateTermResponseDto, HttpStatus.CREATED)
  async createTerm(@Body() input: CreateTermRequestDto): Promise<CreateTermResponseDto> {
    return this.commandBus.execute(new CreateTermCommand(input));
  }

  @Patch(':id')
  @Permissions(AdminPermission.terms.update)
  @ApiOperation({ summary: '약관 수정' })
  @SwaggerApiResponse(UpdateTermResponseDto)
  async updateTerm(@Param('id') id: string, @Body() input: UpdateTermRequestDto): Promise<UpdateTermResponseDto> {
    return this.commandBus.execute(new UpdateTermCommand({ termId: id, data: input }));
  }

  @Post(':id/publish')
  @Permissions(AdminPermission.terms.publish)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 게시' })
  @SwaggerApiResponse(PublishTermResponseDto)
  async publishTerm(@Param('id') id: string): Promise<PublishTermResponseDto> {
    return this.commandBus.execute(new PublishTermCommand(PublishTermRequestDto.parse({ termId: id }).validate()));
  }

  @Delete(':id')
  @Permissions(AdminPermission.terms.delete)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 삭제' })
  @SwaggerApiResponse(DeleteTermResponseDto)
  async deleteTerm(@Param('id') id: string): Promise<DeleteTermResponseDto> {
    return this.commandBus.execute(new DeleteTermCommand(DeleteTermRequestDto.parse({ termId: id }).validate()));
  }

  @Get(':termId')
  @ApiOperation({ summary: '게시된 약관 상세 조회' })
  @SwaggerApiResponse(GetTermResponseDto)
  getTerm(@Param('termId') termId: string): Promise<GetTermResponseDto> {
    return this.queryBus.execute(new GetTermQuery(GetTermRequestDto.parse({ termId }).validate()));
  }

  @SkipPasswordExpiry()
  @Post('agreements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '약관 동의 저장' })
  @SwaggerApiResponse(SetAgreementsResponseDto)
  async setAgreements(@Body() input: SetAgreementsRequestDto): Promise<SetAgreementsResponseDto> {
    return this.commandBus.execute(new SetAgreementsCommand(input));
  }
}
