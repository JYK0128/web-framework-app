import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiExcludeController, ApiOperation, ApiTags } from '@nestjs/swagger';

import { MachineAuth } from '#/core/http/decorators/auth-mode.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { CreateInternalServiceTermGroupRequestDto, CreateInternalServiceTermRequestDto, DeleteInternalServiceTermGroupResponseDto, DeleteInternalServiceTermResponseDto, GetInternalServiceTermsRequestDto, InternalServiceTermGroupItemDto, InternalServiceTermGroupListResponseDto, InternalServiceTermItemDto, InternalServiceTermPageResponseDto } from '#/modules/service-terms';
import { GetInternalServiceTermsQuery } from '#/modules/service-terms/get-internal-service-terms.query';
import { GetInternalServiceTermGroupsQuery } from '#/modules/service-terms/groups/get-internal-service-term-groups.query';
import { CreateInternalServiceTermGroupCommand, DeleteInternalServiceTermGroupCommand, UpdateInternalServiceTermGroupCommand } from '#/modules/service-terms/groups/internal-service-term-group.commands';
import { UpdateInternalServiceTermGroupRequestDto } from '#/modules/service-terms/groups/update-internal-service-term-group.request.dto';
import { CreateInternalServiceTermCommand, DeleteInternalServiceTermCommand, PublishInternalServiceTermCommand, UpdateInternalServiceTermCommand } from '#/modules/service-terms/internal-service-term.commands';
import { GetTermRevisionsQuery } from '#/modules/service-terms/revisions/get-term-revisions.query';
import { GetTermRevisionsRequestDto, TermRevisionPageResponseDto } from '#/modules/service-terms/revisions/term-revision.dto';
import { UpdateInternalServiceTermRequestDto } from '#/modules/service-terms/update-internal-service-term.request.dto';

@ApiTags('Internal (Machine)')
@ApiExcludeController()
@MachineAuth()
@Controller('internal/service-terms')
export class InternalServiceTermsController {
  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}
  @Get('groups') @ApiOperation({ summary: 'Machine: 서비스 약관 그룹 목록 조회' }) @SwaggerApiResponse(InternalServiceTermGroupListResponseDto)
  groups(): Promise<InternalServiceTermGroupListResponseDto> { return this.queryBus.execute(new GetInternalServiceTermGroupsQuery()); }

  @Get('groups/:groupId/revisions')
  @ApiOperation({ summary: 'Machine: 서비스 약관 개정 이력 조회' })
  @SwaggerApiResponse(TermRevisionPageResponseDto)
  getRevisions(@Param('groupId') groupId: string, @Query() dto: GetTermRevisionsRequestDto): Promise<TermRevisionPageResponseDto> {
    return this.queryBus.execute(new GetTermRevisionsQuery({ groupId, dto }));
  }

  @Post('groups') @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(InternalServiceTermGroupItemDto, HttpStatus.CREATED)
  createGroup(@Body() input: CreateInternalServiceTermGroupRequestDto): Promise<InternalServiceTermGroupItemDto> { return this.commandBus.execute(new CreateInternalServiceTermGroupCommand(input)); }

  @Patch('groups/:id') @SwaggerApiResponse(InternalServiceTermGroupItemDto)
  updateGroup(@Param('id') id: string, @Body() input: UpdateInternalServiceTermGroupRequestDto): Promise<InternalServiceTermGroupItemDto> { return this.commandBus.execute(new UpdateInternalServiceTermGroupCommand({ groupId: id, dto: input })); }

  @Delete('groups/:id') @SwaggerApiResponse(DeleteInternalServiceTermGroupResponseDto)
  deleteGroup(@Param('id') id: string): Promise<DeleteInternalServiceTermGroupResponseDto> { return this.commandBus.execute(new DeleteInternalServiceTermGroupCommand({ groupId: id })); }

  @Get() @ApiOperation({ summary: 'Machine: 서비스 약관 목록 조회' }) @SwaggerApiResponse(InternalServiceTermPageResponseDto)
  list(@Query() query: GetInternalServiceTermsRequestDto): Promise<InternalServiceTermPageResponseDto> { return this.queryBus.execute(new GetInternalServiceTermsQuery(query)); }

  @Post() @HttpCode(HttpStatus.CREATED) @SwaggerApiResponse(InternalServiceTermItemDto, HttpStatus.CREATED)
  create(@Body() input: CreateInternalServiceTermRequestDto): Promise<InternalServiceTermItemDto> { return this.commandBus.execute(new CreateInternalServiceTermCommand(input)); }

  @Patch(':id') @SwaggerApiResponse(InternalServiceTermItemDto)
  update(@Param('id') id: string, @Body() input: UpdateInternalServiceTermRequestDto): Promise<InternalServiceTermItemDto> { return this.commandBus.execute(new UpdateInternalServiceTermCommand({ termId: id, dto: input })); }

  @Post(':id/publish') @HttpCode(HttpStatus.OK) @SwaggerApiResponse(InternalServiceTermItemDto)
  publish(@Param('id') id: string): Promise<InternalServiceTermItemDto> { return this.commandBus.execute(new PublishInternalServiceTermCommand({ termId: id })); }

  @Delete(':id') @SwaggerApiResponse(DeleteInternalServiceTermResponseDto)
  delete(@Param('id') id: string): Promise<DeleteInternalServiceTermResponseDto> { return this.commandBus.execute(new DeleteInternalServiceTermCommand({ termId: id })); }
}
